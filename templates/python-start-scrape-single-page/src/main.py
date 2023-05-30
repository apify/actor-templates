from urllib.parse import urljoin

import requests
from apify import Actor
from bs4 import BeautifulSoup

async def main():
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        url = actor_input.get('url')

        try:
            # Fetch the URL using `requests` and parse it using `BeautifulSoup`
            response = requests.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract all headings from the page
            headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

            # Push the data to default Dataset
            for heading in headings:
                await Actor.push_data({ 'level': heading.name, 'text': heading.text })
        except:
            Actor.log.exception(f'Cannot extract data from {url}.')
