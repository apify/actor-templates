"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, use the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import logging

from apify import Actor
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

from src.models import AgentStructuredOutput
from src.tools import tool_calculator_sum, tool_scrape_instagram_profile_posts
from src.utils import log_state


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.

    Raises:
        ValueError: If the input is missing required attributes.
    """
    async with Actor:
        # Charge for Actor start
        await Actor.charge('actor-start')

        # Handle input
        actor_input = await Actor.get_input()

        query = actor_input.get('query')
        if not query:
            msg = 'Missing "query" attribute in input!'
            raise ValueError(msg)

        model_name = actor_input.get('modelName', 'gpt-4o-mini')
        if actor_input.get('debug', False):
            Actor.log.setLevel(logging.DEBUG)

        llm = ChatOpenAI(model=model_name)  # ty: ignore[unknown-argument]

        # Create the agent graph
        # see https://docs.langchain.com/oss/python/langchain/agents
        tools = [tool_calculator_sum, tool_scrape_instagram_profile_posts]
        graph = create_agent(llm, tools, response_format=AgentStructuredOutput)

        inputs: dict = {'messages': [('user', query)]}
        response: AgentStructuredOutput | None = None
        last_message: str | None = None
        async for state in graph.astream(inputs, stream_mode='values'):
            log_state(state)
            if 'structured_response' in state:
                response = state['structured_response']
                last_message = state['messages'][-1].content
                break

        if not response or not last_message:
            Actor.log.error('Failed to get a response from the agent!')
            await Actor.fail(status_message='Failed to get a response from the agent!')
            return

        # Charge for task completion
        await Actor.charge('task-completed')

        # Push results to the key-value store and dataset
        store = await Actor.open_key_value_store()
        await store.set_value('response.txt', last_message)
        Actor.log.info('Saved the "response.txt" file into the key-value store!')

        await Actor.push_data(
            {
                'response': last_message,
                'structured_response': response.dict(),
            }
        )
        Actor.log.info('Pushed data into the dataset!')
