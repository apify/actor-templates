from urllib.parse import urljoin

import requests
from apify import Actor
from bs4 import BeautifulSoup

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

        # Process the requests in the queue one by one
        while request := await default_queue.fetch_next_request():
            url = request['url']
            Actor.log.info(f'Scraping {url}...')

            try:
                # Fetch the URL using `requests` and parse it using `BeautifulSoup`
                response = requests.get(url)
                soup = BeautifulSoup(response.content, 'html.parser')

                # If we haven't reached the max depth,
                # look for nested links and enqueue their targets
                if request['depth'] < max_depth:
                    for link in soup.find_all('a'):
                        link_href = link.get('href')
                        link_url = urljoin(url, link_href)
                        if link_url.startswith(('http://', 'https://')):
                            Actor.log.info(f'Enqueuing {link_url}...')
                            await default_queue.add_request({
                                'url': link_url,
                                'depth': request['depth'] + 1,
                            })

                # Push the title of the page into the default dataset
                await Actor.push_data({ 'url': url, 'title': soup.title.string })
            except:
                Actor.log.exception(f'Cannot extract data from {url}.')
            finally:
                # Mark the request as handled so it's not processed again
                await default_queue.mark_request_as_handled(request)
