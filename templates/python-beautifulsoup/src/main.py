"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from urllib.parse import urljoin

from bs4 import BeautifulSoup
from httpx import AsyncClient

from apify import Actor, Request


async def main() -> None:
    """Main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        # Read the Actor input, specifying default values if not provided.
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [{'url': 'https://apify.com'}])
        max_depth = actor_input.get('max_depth', 1)

        # Exit if no start URLs are provided in the input.
        if not start_urls:
            Actor.log.info('No start URLs specified in Actor input, exiting...')
            await Actor.exit()

        # Open the default request queue for handling URLs to be processed.
        request_queue = await Actor.open_request_queue()

        # Enqueue each start URL with an initial crawl depth of 0.
        for start_url in start_urls:
            url = start_url.get('url')
            Actor.log.info(f'Enqueuing {url} ...')
            request = Request.from_url(url, user_data={'depth': 0})
            await request_queue.add_request(request)

        # Process each request from the queue one by one.
        while request := await request_queue.fetch_next_request():
            url = request.url
            depth = request.user_data['depth']
            Actor.log.info(f'Scraping {url} ...')

            try:
                # Fetch the URL content using HTTPX.
                async with AsyncClient() as client:
                    response = await client.get(url, follow_redirects=True)

                # Parse the HTML content using Beautiful Soup.
                soup = BeautifulSoup(response.content, 'html.parser')

                # If the current depth is less than the maximum allowed, find and enqueue nested links.
                if depth < max_depth:
                    for link in soup.find_all('a'):
                        link_href = link.get('href')
                        link_url = urljoin(url, link_href)

                        if link_url.startswith(('http://', 'https://')):
                            Actor.log.info(f'Enqueuing {link_url} ...')
                            request = Request.from_url(link_url, user_data={'depth': depth + 1})
                            await request_queue.add_request(request)

                # Extract the desired data.
                data = {
                    'url': url,
                    'title': soup.title.string if soup.title else None,
                }

                # Push the extracted data to the dataset.
                await Actor.push_data(data)

            except Exception:
                Actor.log.exception(f'Cannot extract data from {url}.')

            finally:
                # Mark the request as handled to ensure it is not processed again.
                await request_queue.mark_request_as_handled(request)
