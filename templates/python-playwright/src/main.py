import asyncio
from urllib.parse import urljoin

from apify import Actor
from playwright.async_api import async_playwright


async def page_function(page, request):
    title = await page.title()
    await asyncio.sleep(5) # Sleep to show opened page
    return {'title': title, 'url': request['url']}


async def main():
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [])
        max_depth = actor_input.get('max_depth', 2)

        # Enqueue the starting URLs in the default request queue
        default_queue = await Actor.open_request_queue()
        for start_url in start_urls:
            url = start_url.get('url')
            Actor.log.info(f'Enqueuing {url}...')
            await default_queue.add_request({ 'url': url, 'depth': 0 })

        # Launch Playwright an open a new browser context
        Actor.log.info('Launching Playwright...')
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=False)
            context = await browser.new_context()

            # Process the requests in the queue one by one
            while request := await default_queue.fetch_next_request():
                url = request['url']
                Actor.log.info(f'Scraping {url}...')

                try:
                    # Open the URL in a new Playwright page
                    page = await context.new_page()
                    await page.goto(url)

                    # If we haven't reached the max depth,
                    # look for nested links and enqueue their targets
                    if request['depth'] < max_depth:
                        for link in await page.locator('a').all():
                            link_href = link.get_attribute('href')
                            link_url = urljoin(url, link_href)
                            if link_url.startswith(('http://', 'https://')):
                                Actor.log.info(f'Enqueuing {link_url}...')
                                await default_queue.add_request({
                                    'url': link_url,
                                    'depth': request['depth'] + 1,
                                })

                    # Push the title of the page into the default dataset
                    await Actor.push_data({ 'url': url, 'title': await page.title() })
                except:
                    Actor.log.exception(f'Cannot extract data from {url}.')
                finally:
                    await page.close()
                    await default_queue.mark_request_as_handled(request)
