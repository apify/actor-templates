"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

import os

from apify import Actor
from smolagents import CodeAgent, DuckDuckGoSearchTool, OpenAIServerModel

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_API_BASE = 'https://api.openai.com/v1'


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        actor_input = await Actor.get_input() or {}

        model = actor_input.get('model')
        if not model:
            raise ValueError('Missing "model" attribute in Actor input!')

        query = actor_input.get('query')
        if not query:
            raise ValueError('Missing "query" attribute in Actor input!')

        model = OpenAIServerModel(
            model_id=model,
            api_base=OPENAI_API_BASE,
            api_key=OPENAI_API_KEY,
        )

        agent = CodeAgent(
            tools=[DuckDuckGoSearchTool()],
            model=model,
        )

        result = agent.run(query)

        Actor.log.info(f'Agent result: {result}')

        await Actor.push_data(result)
