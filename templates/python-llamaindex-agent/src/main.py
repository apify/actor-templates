"""Module defines the main entry point for the Apify LlamaIndex Agent.

This Agent template is intended to give example on how to use LlamaIndex Agent with Apify Actors.
It extracts contact details from a plain text query with a URL.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from apify import Actor
from llama_index.llms.openai import OpenAI

from .agent import run_agent

if TYPE_CHECKING:
    from llama_index.core.chat_engine.types import AgentChatResponse


async def main() -> None:
    """Define a main entry point for the Apify LlamaIndex Agent.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        Actor.log.info('Starting LlamaIndex Agent')
        # Charge for Actor start
        await Actor.charge('actor-start')
        Actor.log.info('Charged for Actor start')
        try:
            if not (actor_input := await Actor.get_input()):
                await Actor.fail(status_message='Actor input was not provided')
                return
            await check_inputs(actor_input)
            answer = await run_query(actor_input['query'], actor_input['modelName'])
            await Actor.push_data({'query': actor_input['query'], 'answer': answer})
            Actor.log.info('Charging for task completed')
            await Actor.charge(event_name='task-completed', count=1)
        except Exception as e:
            await Actor.fail(status_message='Failed to process query', exception=e)


async def check_inputs(actor_input: dict) -> None:
    """Check that provided input exists.

    :raises Exception: If query is not provided
    """
    if not actor_input.get('query'):
        msg = 'Input `query` is not provided. Please verify that the `query` is correctly set.'
        await Actor.fail(status_message=msg)


async def run_query(query: str, model_name: str) -> AgentChatResponse | None:
    """Process query with LlamaIndex Agent."""
    llm = OpenAI(model=str(model_name), temperature=0)
    try:
        return await run_agent(query=query, llm=llm, verbose=True)
    except Exception as e:
        msg = f'Error running LlamaIndex Agent, error: {e}'
        await Actor.fail(status_message=msg, exception=e)
