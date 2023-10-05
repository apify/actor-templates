# Beautiful Soup - library for pulling data out of HTML and XML files (Read more at https://www.crummy.com/software/BeautifulSoup/bs4/doc)
from bs4 import BeautifulSoup
# HTTPX - library for making asynchronous HTTP requests in Python (Read more at https://www.python-httpx.org/)
from httpx import AsyncClient

# Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/python)
from apify import Actor


async def main():
    async with Actor:
        # Structure of input is defined in input_schema.json
        actor_input = await Actor.get_input() or {}
        url = actor_input.get('url')

        # Create an asynchronous HTTPX client
        async with AsyncClient() as client:
            # Fetch the HTML content of the page.
            response = await client.get(url)

        # Parse the HTML content using Beautiful Soup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract all headings from the page (tag name and text)
        headings = []
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            heading_object = {'level': heading.name, 'text': heading.text}
            Actor.log.info(f'Extracted heading: {heading_object}')
            headings.append(heading_object)

        # Save headings to Dataset - a table-like storage
        await Actor.push_data(headings)
