"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from urllib.parse import urljoin

from playwright.async_api import async_playwright

from apify import Actor, Request

# Note: To run this Actor locally, ensure that Playwright browsers are installed.
# Run `playwright install --with-deps` in the Actor's virtual environment to install them.
# When running on the Apify platform, these dependencies are already included in the Actor's Docker image.


async def main() -> None:
    """Main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        # Retrieve the Actor input, and use default values if not provided.
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [{'url': 'https://apify.com'}])
        max_depth = actor_input.get('max_depth', 1)

        # Exit if no start URLs are provided.
        if not start_urls:
            Actor.log.info('No start URLs specified in actor input, exiting...')
            await Actor.exit()

        # Open the default request queue for handling URLs to be processed.
        request_queue = await Actor.open_request_queue()

        # Enqueue the start URLs with an initial crawl depth of 0.
        for start_url in start_urls:
            url = start_url.get('url')
            Actor.log.info(f'Enqueuing {url} ...')
            request = Request.from_url(url, user_data={'depth': 0})
            await request_queue.add_request(request)

        Actor.log.info('Launching Playwright...')

        # Launch Playwright and open a new browser context.
        async with async_playwright() as playwright:
            # Configure the browser to launch in headless mode as per Actor configuration.
            browser = await playwright.chromium.launch(headless=Actor.config.headless)
            context = await browser.new_context()

            # Process the URLs from the request queue.
            while request := await request_queue.fetch_next_request():
                url = request.url
                depth = request.user_data['depth']
                Actor.log.info(f'Scraping {url} ...')

                try:
                    # Open a new page in the browser context and navigate to the URL.
                    page = await context.new_page()
                    await page.goto(url)

                    # If the current depth is less than max_depth, find nested links and enqueue them.
                    if depth < max_depth:
                        for link in await page.locator('a').all():
                            link_href = await link.get_attribute('href')
                            link_url = urljoin(url, link_href)

                            if link_url.startswith(('http://', 'https://')):
                                Actor.log.info(f'Enqueuing {link_url} ...')
                                request = Request.from_url(link_url, user_data={'depth': depth + 1})
                                await request_queue.add_request(request)

                    # Extract the desired data.
                    data = {
                        'url': url,
                        'title': await page.title(),
                    }

                    # Store the extracted data to the default dataset.
                    await Actor.push_data(data)

                except Exception:
                    Actor.log.exception(f'Cannot extract data from {url}.')

                finally:
                    await page.close()
                    # Mark the request as handled to ensure it is not processed again.
                    await request_queue.mark_request_as_handled(request)
