"""
This module defines the `main()` coroutine for the Apify Actor, executed from the `__main__.py` file.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from urllib.parse import urljoin

from playwright.async_api import async_playwright

from apify import Actor

# To run this Actor locally, you need to have the Playwright browsers installed.
# Run `playwright install --with-deps` in the Actor's virtual environment to install them.
# When running on the Apify platform, they are already included in the Actor's Docker image.


async def main() -> None:
    """
    The main coroutine is being executed using `asyncio.run()`, so do not attempt to make a normal function
    out of it, it will not work. Asynchronous execution is required for communication with Apify platform,
    and it also enhances performance in the field of web scraping significantly.
    """
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [{'url': 'https://apify.com'}])
        max_depth = actor_input.get('max_depth', 1)

        if not start_urls:
            Actor.log.info('No start URLs specified in actor input, exiting...')
            await Actor.exit()

        # Enqueue the starting URLs in the default request queue
        default_queue = await Actor.open_request_queue()
        for start_url in start_urls:
            url = start_url.get('url')
            Actor.log.info(f'Enqueuing {url} ...')
            await default_queue.add_request({'url': url, 'userData': {'depth': 0}})

        # Launch Playwright an open a new browser context
        Actor.log.info('Launching Playwright...')
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=Actor.config.headless)
            context = await browser.new_context()

            # Process the requests in the queue one by one
            while request := await default_queue.fetch_next_request():
                url = request['url']
                depth = request['userData']['depth']
                Actor.log.info(f'Scraping {url} ...')

                try:
                    # Open the URL in a new Playwright page
                    page = await context.new_page()
                    await page.goto(url)

                    # If we haven't reached the max depth,
                    # look for nested links and enqueue their targets
                    if depth < max_depth:
                        for link in await page.locator('a').all():
                            link_href = await link.get_attribute('href')
                            link_url = urljoin(url, link_href)
                            if link_url.startswith(('http://', 'https://')):
                                Actor.log.info(f'Enqueuing {link_url} ...')
                                await default_queue.add_request({
                                    'url': link_url,
                                    'userData': {'depth': depth + 1},
                                })

                    # Push the title of the page into the default dataset
                    title = await page.title()
                    await Actor.push_data({'url': url, 'title': title})
                except Exception:
                    Actor.log.exception(f'Cannot extract data from {url}.')
                finally:
                    await page.close()
                    await default_queue.mark_request_as_handled(request)
