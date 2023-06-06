from urllib.parse import urljoin

import requests
from apify import Actor
from bs4 import BeautifulSoup

async def main():
    async with Actor:
        # Read the Actor input
        actor_input = await Actor.get_input() or {}
        url = actor_input.get('url')

        # Fetch the URL using `requests` and parse it using `BeautifulSoup`
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')

        headings = []

        # Extract all headings from the page (tag name and text).
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            heading_object = { 'level': heading.name, 'text': heading.text }
            print('Extracted heading', heading_object)
            headings.append(heading_object)

        # Save headings to Dataset - a table-like storage.
        await Actor.push_data(headings)
