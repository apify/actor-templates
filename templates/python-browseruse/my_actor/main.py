"""Module defines the main entry point for the Apify Actor.

One Browser Use agent runs one task in one browser and stores its structured result as dataset rows.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING
from urllib.parse import unquote, urlsplit

import psutil
from apify import Actor
from browser_use import ActionResult, Agent, Browser, ChatOpenAI, Tools
from browser_use.browser import BrowserProfile, ProxySettings
from browser_use.browser.watchdogs.local_browser_watchdog import LocalBrowserWatchdog
from browser_use.dom.views import DEFAULT_INCLUDE_ATTRIBUTES
from pydantic import BaseModel, Field

from .compat import agent_signal_options, run_agent_with_actor_signals
from .config import MAX_ITEMS, RunConfig, normalize_input

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping

# The agent reads links through the `read_page_links` action below and returns the result through `done`. The built-in
# file-system, `extract`, and page-query actions let a model collect the data again and again without finishing, and
# `search` takes it off the start page to a web search. The rest have no use in an extraction run.
EXCLUDED_ACTIONS = [
    'evaluate',
    'extract',
    'find_elements',
    'find_text',
    'read_file',
    'replace_file',
    'save_as_pdf',
    'screenshot',
    'search',
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
# The template launches Chrome itself and hands Browser Use the running browser, since Browser Use's own launch gives
# Chrome a fixed 30 s to open its debugging port and the first tab 4 s to attach, which a cold start on a small machine
# (e.g. a CI runner) can exceed. A launch that doesn't come up in time is retried with a fresh browser, and a failed
# connection to a running browser is retried after a pause.
BROWSER_LAUNCH_ATTEMPTS = 2
BROWSER_LAUNCH_TIMEOUT_SECS = 90
BROWSER_CONNECT_ATTEMPTS = 5
BROWSER_RETRY_DELAY_SECS = 2
# Browser Use's 15 s navigation limit in older releases is tight for a first page load through a proxy. A value set in
# the environment wins.
BROWSER_EVENT_TIMEOUTS_SECS = {'TIMEOUT_NavigateToUrlEvent': 60}
# Upper bound on the links `read_page_links` hands to the model, which keeps its prompt small on link-heavy pages.
MAX_ACTION_LINKS = 300


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


async def snapshot_page_links(browser: Browser) -> list[Mapping[str, object]]:
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
        return await snapshot_page_links(browser)
    except Exception:
        Actor.log.warning('Could not read links from the final page; keeping the URLs returned by the model.')
        return []


def format_page_links(links: Iterable[Mapping[str, object]]) -> str:
    """Render the titled, absolute HTTP(S) links of a page as JSON lines, de-duplicated and in page order."""
    lines: list[str] = []
    seen: set[tuple[str, str]] = set()
    for link in links:
        title = _normalize_title(str(link.get('title', '')))
        url = str(link.get('url', ''))
        if not title or not is_http_url(url) or (title, url) in seen:
            continue
        seen.add((title, url))
        lines.append(json.dumps({'title': title, 'url': url}, ensure_ascii=False))
        if len(lines) >= MAX_ACTION_LINKS:
            break
    return '\n'.join(lines)


def build_tools() -> Tools:
    """Create the agent's actions: the built-in ones minus `EXCLUDED_ACTIONS`, plus `read_page_links`."""
    tools = Tools(exclude_actions=EXCLUDED_ACTIONS)

    @tools.action(
        'Return the title and exact absolute URL (href) of every link on the current page, in page order. '
        'Use it to read the items, then call done.'
    )
    # Browser Use injects `browser_session` by name and rejects a string annotation, which `from __future__ import
    # annotations` would turn the type into, so the parameter stays unannotated.
    async def read_page_links(browser_session) -> ActionResult:  # noqa: ANN001
        page_links = format_page_links(await snapshot_page_links(browser_session))
        return ActionResult(
            extracted_content=(
                f'Links on the current page, one JSON object per line:\n{page_links}\n'
                'Pick the requested items from these links and call done with them now.'
            ),
        )

    return tools


@dataclass
class LaunchedChrome:
    """A Chrome process started by the template, with its debugging endpoint."""

    process: subprocess.Popen[bytes]
    user_data_dir: str
    cdp_url: str


def find_chrome() -> str:
    """Return the Chrome executable: the one in the Apify image, else one Browser Use finds on the machine."""
    path = os.getenv('APIFY_CHROME_EXECUTABLE_PATH') or LocalBrowserWatchdog._find_installed_browser_path()  # noqa: SLF001
    if not path:
        msg = 'No Chrome found - install one (e.g. `playwright install chromium`) or set APIFY_CHROME_EXECUTABLE_PATH'
        raise RuntimeError(msg)
    return path


def chrome_args(*, headless: bool, proxy: ProxySettings | None, user_data_dir: str) -> list[str]:
    """Build Chrome's command-line flags, the same set Browser Use launches its own browser with."""
    profile = BrowserProfile(
        # Chrome's sandbox fails to start on hosts that restrict user namespaces (e.g. Ubuntu 24.04). Browser Use only
        # disables it inside Docker, while Playwright and the other Chrome templates disable it everywhere.
        chromium_sandbox=False,
        enable_default_extensions=False,
        headless=headless,
        proxy=proxy,
        user_data_dir=user_data_dir,
    )
    # Port 0 lets Chrome pick a free port and write it to `DevToolsActivePort` in the profile directory.
    return [*profile.get_args(), '--remote-debugging-port=0', 'about:blank']


def read_cdp_url(user_data_dir: str) -> str | None:
    """Return the debugging endpoint once Chrome has opened its port and answers on it."""
    try:
        port = int((Path(user_data_dir) / 'DevToolsActivePort').read_text().split()[0])
        cdp_url = f'http://127.0.0.1:{port}'
        with urllib.request.urlopen(f'{cdp_url}/json/version', timeout=2):  # noqa: S310
            return cdp_url
    except (OSError, ValueError, IndexError):
        return None


def kill_chrome(chrome: LaunchedChrome) -> None:
    """Kill the Chrome process tree and remove its profile directory."""
    try:
        root = psutil.Process(chrome.process.pid)
        processes = [*root.children(recursive=True), root]
    except psutil.Error:
        processes = []
    for process in processes:
        with contextlib.suppress(psutil.Error):
            process.kill()
    psutil.wait_procs(processes, timeout=5)
    shutil.rmtree(chrome.user_data_dir, ignore_errors=True)


async def launch_chrome(*, headless: bool, proxy: ProxySettings | None) -> LaunchedChrome:
    """Start Chrome and wait until its debugging endpoint answers."""
    executable = find_chrome()
    for attempt in range(1, BROWSER_LAUNCH_ATTEMPTS + 1):
        # `BrowserProfile` copies a profile directory to a new temporary one unless its name has this prefix.
        user_data_dir = tempfile.mkdtemp(prefix='browser-use-user-data-dir-')
        process = subprocess.Popen(  # noqa: ASYNC220, S603
            [executable, *chrome_args(headless=headless, proxy=proxy, user_data_dir=user_data_dir)],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        chrome = LaunchedChrome(process=process, user_data_dir=user_data_dir, cdp_url='')
        deadline = time.monotonic() + BROWSER_LAUNCH_TIMEOUT_SECS
        try:
            while process.poll() is None and time.monotonic() < deadline:
                cdp_url = await asyncio.to_thread(read_cdp_url, user_data_dir)
                if cdp_url:
                    chrome.cdp_url = cdp_url
                    return chrome
                await asyncio.sleep(0.25)
        finally:
            if not chrome.cdp_url:
                kill_chrome(chrome)
        reason = f'exited with code {process.returncode}' if process.returncode is not None else 'timed out'
        Actor.log.warning('Chrome launch %s (attempt %d/%d).', reason, attempt, BROWSER_LAUNCH_ATTEMPTS)
    msg = f'Chrome did not start after {BROWSER_LAUNCH_ATTEMPTS} attempts'
    raise RuntimeError(msg)


def build_browser(config: RunConfig, *, cdp_url: str, headless: bool, proxy: ProxySettings | None) -> Browser:
    """Create a Browser Use session on the launched Chrome, kept open for post-agent link grounding."""
    for name, secs in BROWSER_EVENT_TIMEOUTS_SECS.items():
        os.environ.setdefault(name, str(secs))
    return Browser(
        cdp_url=cdp_url,
        headless=headless,
        keep_alive=True,
        # Browser Use answers the proxy's authentication challenge with these credentials.
        proxy=proxy,
        wait_between_actions=config.action_delay_secs,
    )


async def connect_browser(
    config: RunConfig,
    chrome: LaunchedChrome,
    *,
    headless: bool,
    proxy: ProxySettings | None,
) -> Browser:
    """Connect Browser Use to the launched Chrome, retrying while its first tab is still coming up."""
    attempt = 1
    while True:
        browser = build_browser(config, cdp_url=chrome.cdp_url, headless=headless, proxy=proxy)
        try:
            await browser.start()
        except Exception:
            # `kill` on a session started from `cdp_url` only disconnects; Chrome itself stays up for the next attempt.
            await _safe_kill(browser)
            if attempt >= BROWSER_CONNECT_ATTEMPTS:
                raise
            Actor.log.warning('Browser connection failed (attempt %d/%d); retrying.', attempt, BROWSER_CONNECT_ATTEMPTS)
            attempt += 1
            await asyncio.sleep(BROWSER_RETRY_DELAY_SECS)
        else:
            return browser


def build_agent(config: RunConfig, *, llm: ChatOpenAI, browser: Browser) -> Agent:
    """Construct the Browser Use agent for the configured task."""
    task = (
        f'{config.task}\n\n'
        f'Return at most {config.max_items} items. Use only titles and URLs shown on the pages; never invent them. '
        'Call read_page_links to get the exact titles and URLs of the links on the current page, and pick the items '
        'from its result. Do not click links or search the web just to read them. '
        'As soon as you have the items, call done with them.'
    )
    return Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=build_tools(),
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
        chrome: LaunchedChrome | None = None
        browser: Browser | None = None

        try:
            llm = make_llm(config.model_name)
            proxy_configuration = await Actor.create_proxy_configuration(
                actor_proxy_input=config.proxy_configuration,
            )
            proxy_url = await proxy_configuration.new_url() if proxy_configuration else None
            proxy = to_browser_use_proxy(proxy_url) if proxy_url else None
            headless = Actor.configuration.headless
            async with asyncio.timeout(config.deadline_secs):
                chrome = await launch_chrome(headless=headless, proxy=proxy)
                browser = await connect_browser(config, chrome, headless=headless, proxy=proxy)
                agent = build_agent(config, llm=llm, browser=browser)
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
            if chrome is not None:
                kill_chrome(chrome)
