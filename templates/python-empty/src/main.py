# Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/python)
from apify import Actor


async def main():
    async with Actor:
        Actor.log.info('Hello from the Actor!')
        # Write your code here
