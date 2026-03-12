"""Module defines the router and request handlers for the crawler."""

from __future__ import annotations

from apify import Actor
from crawlee.crawlers import PlaywrightCrawlingContext
from crawlee.router import Router

router = Router[PlaywrightCrawlingContext]()


@router.default_handler
async def default_handler(context: PlaywrightCrawlingContext) -> None:
    """Handle each request by extracting data and enqueueing links."""
    url = context.request.url
    Actor.log.info(f'Scraping {url}...')

    # Extract the desired data.
    data = {
        'url': context.request.url,
        'title': await context.page.title(),
        'h1s': [await h1.text_content() for h1 in await context.page.locator('h1').all()],
        'h2s': [await h2.text_content() for h2 in await context.page.locator('h2').all()],
        'h3s': [await h3.text_content() for h3 in await context.page.locator('h3').all()],
    }

    # Store the extracted data to the default dataset.
    await context.push_data(data)

    # Enqueue additional links found on the current page.
    await context.enqueue_links()
