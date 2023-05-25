from urllib.parse import urljoin

import requests
from apify import Actor
from bs4 import BeautifulSoup

async def main():
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        url = actor_input.get('start_url')

        # Enqueue the starting URLs in the default request queue
        default_queue = await Actor.open_request_queue()
        await default_queue.add_request({ 'url': url, 'userData': { 'depth': 0 }})

        # Process the requests in the queue one by one
        while request := await default_queue.fetch_next_request():
            url = request['url']
            depth = request['userData']['depth']
            Actor.log.info(f'Scraping {url} ...')

            try:
                # Fetch the URL using `requests` and parse it using `BeautifulSoup`
                response = requests.get(url)
                soup = BeautifulSoup(response.content, 'html.parser')

                # Push the title of the page into the default dataset
                title = soup.title.string if soup.title else None
                await Actor.push_data({ 'url': url, 'title': title })
            except:
                Actor.log.exception(f'Cannot extract data from {url}.')
            finally:
                # Mark the request as handled so it's not processed again
                await default_queue.mark_request_as_handled(request)
