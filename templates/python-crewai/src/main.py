"""This module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import logging
import os

from apify import Actor
from crewai import Agent, Crew, Task
from pydantic.json_schema import DefsRef

from src.models import AgentStructuredOutput
from src.tools import tool_calculator_sum, tool_scrape_instagram_profile_posts

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
        if (debug := actor_input.get('debug', False)):
            Actor.log.setLevel(logging.DEBUG)
        if not query:
            msg = 'Missing "query" attribute in input!'
            raise ValueError(msg)
        if not openai_api_key:
            msg = 'Missing "openaiApiKey" attribute in input!'
            raise ValueError(msg)

        # Initialize the OpenAI Chat model
        os.environ['OPENAI_API_KEY'] = openai_api_key

        # Create a toolkit for the agent
        tools = [tool_calculator_sum, tool_scrape_instagram_profile_posts]

        # Create an agent
        # For more information, see https://docs.crewai.com/concepts/agents
        agent = Agent(
            role='Helpful agent',
            goal='Assist users with various tasks.',
            backstory='I am a helpful agent that can assist you with various tasks.',
            tools=tools,
            verbose=debug,
        )

        # Create a task assigned to the agent
        # For more information, see https://docs.crewai.com/concepts/tasks
        task = Task(
            description=query,
            expected_output='A helpful response to the user query.',
            agent=agent,
            output_pydantic=AgentStructuredOutput,
        )

        # Create a one-man crew
        # For more information, see https://docs.crewai.com/concepts/crews
        crew = Crew(
            agents=[agent],
            tasks=[task]
        )

        # Kick off the crew and get the response
        crew_output = crew.kickoff()
        raw_response = crew_output.raw
        response = crew_output.pydantic

        if not response or not raw_response:
            Actor.log.error('Failed to get a response from the agent!')
            await Actor.fail(status_message='Failed to get a response from the agent!')

        # Push results to the key-value store and dataset
        store = await Actor.open_key_value_store()
        await store.set_value('response.txt', raw_response)
        Actor.log.info('Saved the "response.txt" file into the key-value store!')

        await Actor.push_data(
            {
                'query': query,
                'response': raw_response,
                'structured_response': response.dict() if response else {},
            }
        )
        Actor.log.info('Pushed the data into the dataset!')
