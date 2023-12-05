"""
This module defines the `main()` coroutine for the Apify Actor, executed from the `__main__.py` file.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

# Beautiful Soup - library for pulling data out of HTML and XML files, read more at
# https://www.crummy.com/software/BeautifulSoup/bs4/doc
from bs4 import BeautifulSoup

# HTTPX - library for making asynchronous HTTP requests in Python, read more at https://www.python-httpx.org/
from httpx import AsyncClient

# Apify SDK - toolkit for building Apify Actors, read more at https://docs.apify.com/sdk/python
from apify import Actor


async def main() -> None:
    """
    The main coroutine is being executed using `asyncio.run()`, so do not attempt to make a normal function
    out of it, it will not work. Asynchronous execution is required for communication with Apify platform,
    and it also enhances performance in the field of web scraping significantly.
    """
    async with Actor:
        # Structure of input is defined in input_schema.json
        actor_input = await Actor.get_input() or {}
        url = actor_input.get('url')

        # Create an asynchronous HTTPX client
        async with AsyncClient() as client:
            # Fetch the HTML content of the page.
            response = await client.get(url, follow_redirects=True)

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
