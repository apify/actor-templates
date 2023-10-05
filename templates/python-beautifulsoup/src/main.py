from urllib.parse import urljoin

from bs4 import BeautifulSoup
from httpx import AsyncClient

from apify import Actor


async def main():
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [{'url': 'https://apify.com'}])
        max_depth = actor_input.get('max_depth', 1)

        if not start_urls:
            Actor.log.info('No start URLs specified in actor input, exiting...')
            await Actor.exit()

        # Enqueue the starting URLs in the default request queue
        rq = await Actor.open_request_queue()
        for start_url in start_urls:
            url = start_url.get('url')
            Actor.log.info(f'Enqueuing {url} ...')
            await rq.add_request({'url': url, 'userData': {'depth': 0}})

        # Process the requests in the queue one by one
        while request := await rq.fetch_next_request():
            url = request['url']
            depth = request['userData']['depth']
            Actor.log.info(f'Scraping {url} ...')

            try:
                # Fetch the URL using `httpx`
                async with AsyncClient() as client:
                    response = await client.get(url)

                # Parse the response using `BeautifulSoup`
                soup = BeautifulSoup(response.content, 'html.parser')

                # If we haven't reached the max depth, look for nested links and enqueue their targets
                if depth < max_depth:
                    for link in soup.find_all('a'):
                        link_href = link.get('href')
                        link_url = urljoin(url, link_href)
                        if link_url.startswith(('http://', 'https://')):
                            Actor.log.info(f'Enqueuing {link_url} ...')
                            await rq.add_request({
                                'url': link_url,
                                'userData': {'depth': depth + 1},
                            })

                # Push the title of the page into the default dataset
                title = soup.title.string if soup.title else None
                await Actor.push_data({'url': url, 'title': title})

            except Exception:
                Actor.log.exception(f'Cannot extract data from {url}.')

            finally:
                # Mark the request as handled so it's not processed again
                await rq.mark_request_as_handled(request)
