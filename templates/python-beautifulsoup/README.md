# Beautiful Soup & Requests template

This Actor uses the popular Requests library to scrape URLs based on its input and then parses HTML using BeautifulSoup and saves results to storage. It also uses Apify SDK for URL queue management.

<details>
<summary><code>main.py</code></summary>

```Python
from urllib.parse import urljoin

import requests
from apify import Actor
from bs4 import BeautifulSoup

async def main():
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('start_urls', [{ 'url': 'https://apify.com' }])
        max_depth = actor_input.get('max_depth', 1)

        if not start_urls:
            Actor.log.info('No start URLs specified in actor input, exiting...')
            await Actor.exit()

        # Enqueue the starting URLs in the default request queue
        default_queue = await Actor.open_request_queue()
        for start_url in start_urls:
            url = start_url.get('url')
            Actor.log.info(f'Enqueuing {url} ...')
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

                # If we haven't reached the max depth,
                # look for nested links and enqueue their targets
                if depth < max_depth:
                    for link in soup.find_all('a'):
                        link_href = link.get('href')
                        link_url = urljoin(url, link_href)
                        if link_url.startswith(('http://', 'https://')):
                            Actor.log.info(f'Enqueuing {link_url} ...')
                            await default_queue.add_request({
                                'url': link_url,
                                'userData': {'depth': depth + 1 },
                            })

                # Push the title of the page into the default dataset
                title = soup.title.string if soup.title else None
                await Actor.push_data({ 'url': url, 'title': title })
            except:
                Actor.log.exception(f'Cannot extract data from {url}.')
            finally:
                # Mark the request as handled so it's not processed again
                await default_queue.mark_request_as_handled(request)
```

</details>
&nbsp;

## Getting Started

---

### Install Apify CLI

#### Using Homebrew

```Bash
brew install apify/tap/apify-cli
```

#### Using NPM

```Bash
npm -g install apify-cli
```

### Create a new Actor using this template

```Bash
apify create my-python-actor -t python-beautifulsoup
```

### Run the Actor locally

```Bash
cd my-python-actor
apify run
```

## Deploy on Apify

---

### Log in to Apify

You will need to provide your [Apify API Token](https://console.apify.com/account/integrations) to complete this action.

```Bash
apify login
```

### Deploy your Actor

This command will deploy and build the Actor on the Apify Platform. You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).

```Bash
apify push
```

## Documentation reference

---

To learn more about Apify and Actors, take a look at the following resources:

- [Using BeautifulSoup in Actors](https://docs.apify.com/sdk/python/docs/guides/beautiful-soup)
- [Apify SDK for Python documentation](https://docs.apify.com/sdk/python/docs/overview/introduction)
- [Apify Platform documentation](https://docs.apify.com/platform)
