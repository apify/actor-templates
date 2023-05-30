from apify import Actor


async def main():
    async with Actor:
        print('Hello from the Actor!')
