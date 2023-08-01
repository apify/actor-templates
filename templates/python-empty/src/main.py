# Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/python)
from apify import Actor
# Beautiful Soup - library for pulling data out of HTML and XML files (Read more at https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
# from bs4 import BeautifulSoup

async def main():
    async with Actor:
        print('Hello from the Actor!')
        """
        Actor code
        """
