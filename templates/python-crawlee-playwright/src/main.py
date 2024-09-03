"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from apify import Actor, Request
from crawlee.playwright_crawler import PlaywrightCrawler, PlaywrightCrawlingContext


async def main() -> None:
    """Main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        # Read the Actor input.
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [{'url': 'https://apify.com'}])

        # Exit if no start URLs are provided.
        if not start_urls:
            Actor.log.info('No start URLs specified in Actor input, exiting...')
            await Actor.exit()

        # Prepare a list of starting requests.
        start_requests = [
            Request.from_url(
                url=url.get('url'),
                user_data={'depth': 0},  # Set initial crawl depth to 0.
            )
            for url in start_urls
        ]

        # Create a crawler.
        crawler = PlaywrightCrawler(
            # Limit the crawl to max requests. Remove or increase it for crawling all links.
            max_requests_per_crawl=50,
            headless=True,
        )

        # Define a request handler, which will be called for every request.
        @crawler.router.default_handler
        async def request_handler(context: PlaywrightCrawlingContext) -> None:
            url = context.request.url
            Actor.log.info(f'Scraping {url}...')

            # Extract data from the page.
            data = {
                'url': context.request.url,
                'title': await context.page.title(),
                # 'h1s': [h1.text for h1 in context.soup.find_all('h1')],
                # 'h2s': [h2.text for h2 in context.soup.find_all('h2')],
                # 'h3s': [h3.text for h3 in context.soup.find_all('h3')],
            }

            # Save the extracted data to the default dataset.
            await context.push_data(data)

            # Enqueue additional links found on the current page.
            await context.enqueue_links()

        # Run the crawler with the starting requests.
        await crawler.run(start_requests)
