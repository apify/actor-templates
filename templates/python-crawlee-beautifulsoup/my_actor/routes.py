"""Module defines the router and request handlers for the crawler."""

from __future__ import annotations

from apify import Actor
from crawlee.crawlers import BeautifulSoupCrawlingContext
from crawlee.router import Router

router = Router[BeautifulSoupCrawlingContext]()


@router.default_handler
async def default_handler(context: BeautifulSoupCrawlingContext) -> None:
    """Handle each request by extracting data and enqueueing links."""
    url = context.request.url
    Actor.log.info(f'Scraping {url}...')

    # Extract the desired data.
    data = {
        'url': context.request.url,
        'title': context.soup.title.string if context.soup.title else None,
        'h1s': [h1.text for h1 in context.soup.find_all('h1')],
        'h2s': [h2.text for h2 in context.soup.find_all('h2')],
        'h3s': [h3.text for h3 in context.soup.find_all('h3')],
    }

    # Store the extracted data to the default dataset.
    await context.push_data(data)

    # Enqueue additional links found on the current page.
    await context.enqueue_links()
