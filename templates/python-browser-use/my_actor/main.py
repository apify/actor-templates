"""Module defines the main entry point for the Apify Actor.

One Browser Use agent runs one task in one browser and stores its structured result as dataset rows.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import TYPE_CHECKING
from urllib.parse import unquote, urlsplit

from apify import Actor
from browser_use import Agent, Browser, ChatOpenAI
from browser_use.browser import ProxySettings
from browser_use.dom.views import DEFAULT_INCLUDE_ATTRIBUTES
from pydantic import BaseModel, Field, HttpUrl

from .compat import agent_signal_options, run_agent_with_actor_signals
from .config import MAX_POSTS, RunConfig, normalize_input

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping

OPENROUTER_DIRECT = 'https://openrouter.ai/api/v1'
OPENROUTER_PROXY = 'https://openrouter.apify.actor/api/v1'
PAGE_LINKS_SCRIPT = """() => Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 2000)
    .map((anchor) => ({
        title: (anchor.textContent || '').replace(/\\s+/g, ' ').trim(),
        url: anchor.href,
    }))"""


class Post(BaseModel):
    """One post extracted by the browser agent."""

    title: str = Field(description='post title exactly as displayed')
    url: HttpUrl = Field(description='exact absolute HTTP(S) href attached to the post title, including path and query')


class Posts(BaseModel):
    """Structured result returned by Browser Use."""

    posts: list[Post] = Field(min_length=1, max_length=MAX_POSTS, description='posts in displayed order')


def make_llm(model: str) -> ChatOpenAI:
    """Build the OpenRouter chat client from the available credentials."""
    direct_key = os.getenv('OPENROUTER_API_KEY')
    apify_token = os.getenv('APIFY_TOKEN')
    if direct_key:
        return ChatOpenAI(model=model, base_url=OPENROUTER_DIRECT, api_key=direct_key)
    if apify_token:
        return ChatOpenAI(model=model, base_url=OPENROUTER_PROXY, api_key=apify_token)
    msg = 'LLM credentials missing - set OPENROUTER_API_KEY locally or run on Apify with APIFY_TOKEN'
    raise RuntimeError(msg)


def to_browser_use_proxy(proxy_url: str) -> ProxySettings:
    """Convert an Apify Proxy URL to Browser Use's structured settings."""
    parts = urlsplit(proxy_url)
    if parts.scheme not in {'http', 'https'} or not parts.hostname or not parts.port:
        msg = 'Apify Proxy returned an invalid HTTP(S) URL'
        raise ValueError(msg)
    return ProxySettings(
        server=f'{parts.scheme}://{parts.hostname}:{parts.port}',
        username=unquote(parts.username or ''),
        password=unquote(parts.password or ''),
    )


def normalize_posts(posts: Iterable[Post], *, limit: int) -> list[dict[str, object]]:
    """Create flat, ordered, de-duplicated dataset rows."""
    rows: list[dict[str, object]] = []
    seen: set[str] = set()
    for post in posts:
        url = str(post.url)
        if url in seen:
            continue
        seen.add(url)
        rows.append({'rank': len(rows) + 1, 'title': post.title, 'url': url})
        if len(rows) >= limit:
            break
    return rows


def _normalize_title(value: str) -> str:
    return ' '.join(value.split())


def reconcile_post_links(posts: Iterable[Post], links: Iterable[Mapping[str, object]]) -> list[Post]:
    """Replace model URLs with unambiguous hrefs observed for the same page title."""
    exact_links: dict[str, Post | None] = {}
    for link in links:
        try:
            exact = Post(title=_normalize_title(str(link.get('title', ''))), url=str(link.get('url', '')))
        except ValueError:
            continue
        if not exact.title:
            continue

        key = exact.title
        previous = exact_links.get(key)
        if key not in exact_links:
            exact_links[key] = exact
        elif previous is not None and previous.url != exact.url:
            exact_links[key] = None

    grounded: list[Post] = []
    for post in posts:
        exact = exact_links.get(_normalize_title(post.title))
        if exact is not None:
            grounded.append(exact)
    return grounded


async def read_page_links(browser: Browser) -> list[Mapping[str, object]]:
    """Read a bounded set of exact absolute anchor hrefs from the active page."""
    page = await browser.must_get_current_page()
    payload = json.loads(await page.evaluate(PAGE_LINKS_SCRIPT))
    if not isinstance(payload, list) or not all(isinstance(item, dict) for item in payload):
        msg = 'Browser returned an invalid page-link snapshot.'
        raise RuntimeError(msg)
    return payload


def build_browser(config: RunConfig, *, headless: bool, proxy_url: str | None) -> Browser:
    """Create a browser that remains available for post-agent link grounding."""
    executable_path = os.getenv('APIFY_CHROME_EXECUTABLE_PATH')
    return Browser(
        enable_default_extensions=False,
        executable_path=executable_path or None,
        headless=headless,
        keep_alive=True,
        proxy=to_browser_use_proxy(proxy_url) if proxy_url else None,
        wait_between_actions=config.action_delay_secs,
    )


def build_agent(config: RunConfig, *, llm: ChatOpenAI, browser: Browser) -> Agent:
    """Construct the Browser Use agent for the configured task."""
    task = (
        f'Open {config.start_url}. {config.task} '
        f'Return no more than {config.max_posts} posts and do not invent missing titles or URLs.'
    )
    return Agent(
        task=task,
        llm=llm,
        browser=browser,
        output_model_schema=Posts,
        # Browser Use omits href from its default DOM representation. Without this, models tend to mistake HN's
        # visible source-domain label for the title link's full destination.
        include_attributes=[*DEFAULT_INCLUDE_ATTRIBUTES, 'href'],
        use_vision=False,
        use_judge=False,
        **agent_signal_options(),
    )


def require_result(result: Posts | None) -> Posts:
    """Reject an agent run that ended without a structured result."""
    if result is None:
        msg = 'The agent stopped without returning a structured result.'
        raise RuntimeError(msg)
    return result


def require_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    """Reject a nominally successful agent response with no usable records."""
    if not rows:
        msg = 'The agent returned no posts that match a link on the final page.'
        raise RuntimeError(msg)
    return rows


async def _safe_kill(browser: Browser | None) -> None:
    if browser is None:
        return
    try:
        await browser.kill()
    except Exception:
        Actor.log.warning('Browser cleanup failed.', exc_info=True)


async def _write_failure(config: RunConfig, started_at: float, error: Exception) -> None:
    await Actor.set_value(
        'OUTPUT',
        {
            'framework': 'browser-use',
            'status': 'failed',
            'model': config.model,
            'startUrl': config.start_url,
            'itemCount': 0,
            'elapsedSecs': round(time.monotonic() - started_at, 2),
            'error': (str(error) or type(error).__name__)[:500],
        },
    )


async def main() -> None:
    """Run one isolated, bounded Browser Use task under the Actor lifecycle."""
    async with Actor:
        raw_input = (await Actor.get_input()) or {}
        if not isinstance(raw_input, dict):
            msg = 'Actor input must be a JSON object'
            raise TypeError(msg)

        config = normalize_input(raw_input)
        started_at = time.monotonic()
        browser: Browser | None = None

        try:
            llm = make_llm(config.model)
            proxy_configuration = await Actor.create_proxy_configuration(
                actor_proxy_input=config.proxy_configuration,
            )
            proxy_url = await proxy_configuration.new_url() if proxy_configuration else None
            browser = build_browser(
                config,
                headless=Actor.configuration.headless,
                proxy_url=proxy_url,
            )
            agent = build_agent(config, llm=llm, browser=browser)

            async with asyncio.timeout(config.deadline_secs):
                history = await run_agent_with_actor_signals(agent, max_steps=config.max_steps)
                result = require_result(history.structured_output)
                page_links = await read_page_links(browser)
            grounded_posts = reconcile_post_links(result.posts, page_links)
            rows = require_rows(normalize_posts(grounded_posts, limit=config.max_posts))

            await Actor.push_data(rows)
            summary = {
                'framework': 'browser-use',
                'status': 'succeeded',
                'model': config.model,
                'startUrl': config.start_url,
                'itemCount': len(rows),
                'elapsedSecs': round(time.monotonic() - started_at, 2),
            }
            await Actor.set_value('OUTPUT', summary)
            await Actor.set_status_message(f'Extracted {len(rows)} post(s).')
            Actor.log.info('Done; wrote %d dataset row(s) and OUTPUT.', len(rows))
        except Exception as error:
            await _write_failure(config, started_at, error)
            raise
        finally:
            await _safe_kill(browser)
