"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import logging

from apify import Actor
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from src.models import AgentStructuredOutput
from src.ppe_utils import charge_for_actor_start, charge_for_model_tokens, get_all_messages_total_tokens
from src.tools import tool_calculator_sum, tool_scrape_instagram_profile_posts
from src.utils import log_state

# fallback input is provided only for testing, you need to delete this line
fallback_input = {
    'query': 'This is fallback test query, do not nothing and ignore it.',
    'modelName': 'gpt-4o-mini',
}


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
        model_name = actor_input.get('modelName', 'gpt-4o-mini')
        if actor_input.get('debug', False):
            Actor.log.setLevel(logging.DEBUG)
        if not query:
            msg = 'Missing "query" attribute in input!'
            raise ValueError(msg)

        await charge_for_actor_start()

        llm = ChatOpenAI(model=model_name)

        # Create the ReAct agent graph
        # see https://langchain-ai.github.io/langgraph/reference/prebuilt/?h=react#langgraph.prebuilt.chat_agent_executor.create_react_agent
        tools = [tool_calculator_sum, tool_scrape_instagram_profile_posts]
        graph = create_react_agent(llm, tools, response_format=AgentStructuredOutput)

        inputs: dict = {'messages': [('user', query)]}
        response: AgentStructuredOutput | None = None
        last_message: str | None = None
        last_state: dict | None = None
        async for state in graph.astream(inputs, stream_mode='values'):
            last_state = state
            log_state(state)
            if 'structured_response' in state:
                response = state['structured_response']
                last_message = state['messages'][-1].content
                break

        if not response or not last_message or not last_state:
            Actor.log.error('Failed to get a response from the ReAct agent!')
            await Actor.fail(status_message='Failed to get a response from the ReAct agent!')
            return

        if not (messages := last_state.get('messages')):
            Actor.log.error('Failed to get messages from the ReAct agent!')
            await Actor.fail(status_message='Failed to get messages from the ReAct agent!')
            return

        if not (total_tokens := get_all_messages_total_tokens(messages)):
            Actor.log.error('Failed to calculate the total number of tokens used!')
            await Actor.fail(status_message='Failed to calculate the total number of tokens used!')
            return

        await charge_for_model_tokens(model_name, total_tokens)

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
