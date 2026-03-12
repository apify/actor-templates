"""Module defines the router and request handlers for the crawler."""

from __future__ import annotations

from apify import Actor
from crawlee.crawlers import ParselCrawlingContext
from crawlee.router import Router

router = Router[ParselCrawlingContext]()


@router.default_handler
async def default_handler(context: ParselCrawlingContext) -> None:
    """Handle each request by extracting data and enqueueing links."""
    url = context.request.url
    Actor.log.info(f'Scraping {url}...')

    # Extract the desired data.
    data = {
        'url': context.request.url,
        'title': context.selector.css('title::text').get(),
        'h1s': context.selector.css('h1::text').getall(),
        'h2s': context.selector.css('h2::text').getall(),
        'h3s': context.selector.css('h3::text').getall(),
    }

    # Store the extracted data to the default dataset.
    await context.push_data(data)

    # Enqueue additional links found on the current page.
    await context.enqueue_links()
