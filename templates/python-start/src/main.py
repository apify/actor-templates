"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

# Beautiful Soup - A library for pulling data out of HTML and XML files. Read more at:
# https://www.crummy.com/software/BeautifulSoup/bs4/doc
from bs4 import BeautifulSoup

# HTTPX - A library for making asynchronous HTTP requests in Python. Read more at:
# https://www.python-httpx.org/
from httpx import AsyncClient

# Apify SDK - A toolkit for building Apify Actors. Read more at:
# https://docs.apify.com/sdk/python
from apify import Actor


async def main() -> None:
    """Main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        # Retrieve the input object for the Actor. The structure of input is defined in input_schema.json.
        actor_input = await Actor.get_input() or {'url': 'https://apify.com/'}
        url = actor_input.get('url')

        # Create an asynchronous HTTPX client for making HTTP requests.
        async with AsyncClient() as client:
            # Fetch the HTML content of the page, following redirects if necessary.
            Actor.log.info(f'Sending a request to {url}')
            response = await client.get(url, follow_redirects=True)

        # Parse the HTML content using Beautiful Soup and lxml parser.
        soup = BeautifulSoup(response.content, 'lxml')

        # Extract all headings from the page (tag name and text).
        headings = []
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            heading_object = {'level': heading.name, 'text': heading.text}
            Actor.log.info(f'Extracted heading: {heading_object}')
            headings.append(heading_object)

        # Save the extracted headings to the dataset, which is a table-like storage.
        await Actor.push_data(headings)
