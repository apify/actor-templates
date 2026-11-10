"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, use the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import logging

from apify import Actor
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langchain_openai import ChatOpenAI

from .models import AgentStructuredOutput
from .tools import tool_calculator_sum, tool_scrape_instagram_profile_posts
from .utils import log_state


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

        llm = ChatOpenAI(model=model_name)

        # Create the agent graph
        # see https://docs.langchain.com/oss/python/langchain/agents
        tools = [tool_calculator_sum, tool_scrape_instagram_profile_posts]
        # `ToolStrategy` makes the agent retry when the model returns output that does not match the schema.
        # Passing the schema directly would use the provider's native structured output, which fails the run instead.
        graph = create_agent(llm, tools, response_format=ToolStrategy(AgentStructuredOutput))

        inputs: dict = {'messages': [('user', query)]}
        response: AgentStructuredOutput | None = None
        async for state in graph.astream(inputs, stream_mode='values'):
            log_state(state)
            # LangChain >= 1.3.15 writes `structured_response: None` into the state on every model turn,
            # so checking only for the key's presence ends the loop on the agent's first tool call.
            if state.get('structured_response') is not None:
                response = state['structured_response']
                break

        if not response:
            Actor.log.error('Failed to get a response from the agent!')
            await Actor.fail(status_message='Failed to get a response from the agent!')
            return

        # Serialize the agent's answer for the text output. The last message in the stream is a LangChain
        # bookkeeping message, not the answer, so build the text from the structured response instead.
        last_message = response.model_dump_json()

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
