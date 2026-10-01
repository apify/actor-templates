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
from browser_use import Agent, Browser, ChatOpenAI, Tools
from browser_use.browser import ProxySettings
from browser_use.dom.views import DEFAULT_INCLUDE_ATTRIBUTES
from pydantic import BaseModel, Field

from .compat import agent_signal_options, run_agent_with_actor_signals
from .config import MAX_ITEMS, RunConfig, normalize_input

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping

# The result reaches the Actor only through `done`. File-system, `extract`, and page-query actions let a model collect
# the data again and again without finishing; the page's elements are already in the agent's browser state. The rest
# have no use in an extraction run.
EXCLUDED_ACTIONS = [
    'evaluate',
    'extract',
    'find_elements',
    'find_text',
    'read_file',
    'replace_file',
    'save_as_pdf',
    'screenshot',
    'search_page',
    'upload_file',
    'write_file',
]
PAGE_LINKS_SCRIPT = """() => Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 2000)
    .map((anchor) => ({
        title: (anchor.textContent || '').replace(/\\s+/g, ' ').trim(),
        url: anchor.href,
    }))"""


class Item(BaseModel):
    """One item extracted by the browser agent."""

    title: str = Field(description='item title exactly as displayed')
    # A plain string, since OpenAI structured outputs reject the `uri` format that `HttpUrl` adds to the schema.
    # `is_http_url` validates it after the run.
    url: str = Field(description='exact absolute HTTP(S) URL of the item, including path and query')


class Items(BaseModel):
    """Structured result returned by Browser Use."""

    items: list[Item] = Field(min_length=1, max_length=MAX_ITEMS, description='items in displayed order')


def make_llm(model_name: str) -> ChatOpenAI:
    """Build the OpenAI chat client, which reads its key from `OPENAI_API_KEY`."""
    if not os.getenv('OPENAI_API_KEY'):
        msg = 'OPENAI_API_KEY is not set - add it to the Actor environment variables or export it for local runs'
        raise RuntimeError(msg)
    # Temperature 0 keeps the agent's choices repeatable for the same page.
    return ChatOpenAI(model=model_name, temperature=0)


def is_http_url(value: str) -> bool:
    """Check that a value is an absolute HTTP(S) URL."""
    parts = urlsplit(value)
    return parts.scheme in {'http', 'https'} and bool(parts.hostname)


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


def normalize_items(items: Iterable[Item], *, limit: int) -> list[dict[str, object]]:
    """Create flat, ordered, de-duplicated dataset rows from items with an absolute HTTP(S) URL."""
    rows: list[dict[str, object]] = []
    seen: set[str] = set()
    for item in items:
        url = item.url.strip()
        if url in seen or not is_http_url(url):
            continue
        seen.add(url)
        rows.append({'rank': len(rows) + 1, 'title': item.title, 'url': url})
        if len(rows) >= limit:
            break
    return rows


def _normalize_title(value: str) -> str:
    return ' '.join(value.split())


def ground_item_links(items: Iterable[Item], links: Iterable[Mapping[str, object]]) -> list[Item]:
    """Swap each model URL for the page href under the same title, when exactly one such href exists.

    Models tend to shorten or mistype long URLs, so a link the page shows for the title is more reliable. Items whose
    title matches no link, or several different links, pass through with the model's URL.
    """
    exact_links: dict[str, Item | None] = {}
    for link in links:
        exact = Item(title=_normalize_title(str(link.get('title', ''))), url=str(link.get('url', '')))
        if not exact.title or not is_http_url(exact.url):
            continue

        key = exact.title
        previous = exact_links.get(key)
        if key not in exact_links:
            exact_links[key] = exact
        elif previous is not None and previous.url != exact.url:
            exact_links[key] = None

    return [exact_links.get(_normalize_title(item.title)) or item for item in items]


async def read_page_links(browser: Browser) -> list[Mapping[str, object]]:
    """Read a bounded set of exact absolute anchor hrefs from the active page."""
    page = await browser.must_get_current_page()
    payload = json.loads(await page.evaluate(PAGE_LINKS_SCRIPT))
    if not isinstance(payload, list) or not all(isinstance(item, dict) for item in payload):
        msg = 'Browser returned an invalid page-link snapshot.'
        raise RuntimeError(msg)
    return payload


async def try_read_page_links(browser: Browser) -> list[Mapping[str, object]]:
    """Read the page links, or return none when the final page can't be inspected (e.g. a PDF or an error page)."""
    try:
        return await read_page_links(browser)
    except Exception:
        Actor.log.warning('Could not read links from the final page; keeping the URLs returned by the model.')
        return []


def build_browser(config: RunConfig, *, headless: bool, proxy_url: str | None) -> Browser:
    """Create a browser that remains available for post-agent link grounding."""
    executable_path = os.getenv('APIFY_CHROME_EXECUTABLE_PATH')
    return Browser(
        # Chrome's sandbox fails to start on hosts that restrict user namespaces (e.g. Ubuntu 24.04). Browser Use only
        # disables it inside Docker, while Playwright and the other Chrome templates disable it everywhere.
        chromium_sandbox=False,
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
        f'{config.task}\n\n'
        f'Return at most {config.max_items} items. Use only titles and URLs shown on the pages; never invent them. '
        'As soon as you have the items, call done with them.'
    )
    return Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=Tools(exclude_actions=EXCLUDED_ACTIONS),
        # Open the start page before the first LLM step, so the agent never spends a step or guesses the URL.
        initial_actions=[{'navigate': {'url': config.start_url, 'new_tab': False}}],
        output_model_schema=Items,
        # Browser Use omits href from its default DOM representation. Without this, models tend to mistake HN's
        # visible source-domain label for the title link's full destination.
        include_attributes=[*DEFAULT_INCLUDE_ATTRIBUTES, 'href'],
        use_vision=False,
        use_judge=False,
        **agent_signal_options(),
    )


def require_result(result: Items | None) -> Items:
    """Reject an agent run that ended without a structured result."""
    if result is None:
        msg = 'The agent stopped without returning a structured result.'
        raise RuntimeError(msg)
    return result


def require_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    """Reject an agent result with no usable rows."""
    if not rows:
        msg = 'The agent returned no items with an absolute HTTP(S) URL.'
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
            'model': config.model_name,
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
            llm = make_llm(config.model_name)
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
                page_links = await try_read_page_links(browser)
            grounded_items = ground_item_links(result.items, page_links)
            rows = require_rows(normalize_items(grounded_items, limit=config.max_items))

            await Actor.push_data(rows)
            summary = {
                'framework': 'browser-use',
                'status': 'succeeded',
                'model': config.model_name,
                'startUrl': config.start_url,
                'itemCount': len(rows),
                'elapsedSecs': round(time.monotonic() - started_at, 2),
            }
            await Actor.set_value('OUTPUT', summary)
            await Actor.set_status_message(f'Extracted {len(rows)} item(s).')
            Actor.log.info('Done; wrote %d dataset row(s) and OUTPUT.', len(rows))
        except Exception as error:
            await _write_failure(config, started_at, error)
            raise
        finally:
            await _safe_kill(browser)
