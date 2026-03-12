"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import asyncio

from apify import Actor, Event
from crawlee.crawlers import BeautifulSoupCrawler

from .routes import router


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    # Enter the context of the Actor.
    async with Actor:
        # Handle graceful abort - Actor is being stopped by user or platform
        async def on_aborting() -> None:
            # Persist any state, do any cleanup you need, and terminate the Actor using
            # `await Actor.exit()` explicitly as soon as possible. This will help ensure that
            # the Actor is doing best effort to honor any potential limits on costs of a
            # single run set by the user.
            # Wait 1 second to allow Crawlee/SDK state persistence operations to complete
            # This is a temporary workaround until SDK implements proper state persistence in the aborting event
            await asyncio.sleep(1)
            await Actor.exit()

        Actor.on(Event.ABORTING, on_aborting)

        # Retrieve the Actor input, and use default values if not provided.
        actor_input = await Actor.get_input() or {}
        start_urls = [
            url.get('url')
            for url in actor_input.get(
                'start_urls',
                [{'url': 'https://apify.com'}],
            )
        ]

        # Exit if no start URLs are provided.
        if not start_urls:
            Actor.log.info('No start URLs specified in Actor input, exiting...')
            await Actor.exit()

        # Create a crawler.
        crawler = BeautifulSoupCrawler(
            # Limit the crawl to max requests. Remove or increase it for crawling all links.
            max_requests_per_crawl=10,
            # Set the request handler to the request router defined in routes.py.
            request_handler=router,
        )

        # Run the crawler with the starting requests.
        await crawler.run(start_urls)
