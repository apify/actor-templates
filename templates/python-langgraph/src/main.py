"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import logging
import os

from apify import Actor
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from src.models import AgentStructuredOutput
from src.tools import tool_calculator_sum, tool_scrape_instagram_profile_posts
from src.utils import log_state

fallback_input = {
    'query': 'This is fallback test query, do not nothing and ignore it.',
    'modelName': 'gpt-4o-mini',
    'openaiApiKey': os.getenv('OPENAI_API_KEY'),
}  # fallback to the OPENAI_API_KEY environment variable when value is not present in the input.


async def main() -> None:
    """Main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.

    Raises:
        ValueError: If the input is missing required attributes.
    """
    async with Actor:
        # Handle input
        actor_input = await Actor.get_input()
        # fallback input is provided only for testing, you need to delete this line
        actor_input = {**fallback_input, **actor_input}

        query = actor_input.get('query')
        openai_api_key = actor_input.get('openaiApiKey')
        model_name = actor_input.get('modelName', 'gpt-4o-mini')
        if actor_input.get('debug', False):
            Actor.log.setLevel(logging.DEBUG)
        if not query:
            msg = 'Missing "query" attribute in input!'
            raise ValueError(msg)
        if not openai_api_key:
            msg = 'Missing "openaiApiKey" attribute in input!'
            raise ValueError(msg)

        # Initialize the OpenAI Chat model
        os.environ['OPENAI_API_KEY'] = openai_api_key
        llm = ChatOpenAI(model=model_name)

        # Create the ReAct agent graph
        # see https://langchain-ai.github.io/langgraph/reference/prebuilt/?h=react#langgraph.prebuilt.chat_agent_executor.create_react_agent
        tools = [tool_calculator_sum, tool_scrape_instagram_profile_posts]
        graph = create_react_agent(llm, tools, response_format=AgentStructuredOutput)

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
            Actor.log.error('Failed to get a response from the ReAct agent!')
            await Actor.fail(status_message='Failed to get a response from the ReAct agent!')

        # Push results to the key-value store and dataset
        store = await Actor.open_key_value_store()
        await store.set_value('response.txt', last_message)
        Actor.log.info('Saved the "response.txt" file into the key-value store!')

        await Actor.push_data(
            {
                'response': last_message,
                'structured_response': response.dict() if response else {},
            }
        )
        Actor.log.info('Pushed the into the dataset!')
