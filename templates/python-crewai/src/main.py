"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import os

from apify import Actor
from crewai import Agent, Crew, Task
from crewai_tools import ApifyActorsTool


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with the Apify platform, and it also enhances performance in
    the field of web scraping significantly.

    Raises:
        ValueError: If the input is missing required attributes.
    """
    # Disable crewAI tracing to prevent stdin read issues at shutdown
    os.environ['CREWAI_TRACING_ENABLED'] = 'false'

    async with Actor:
        apify_token = os.getenv('APIFY_TOKEN')
        if not apify_token:
            raise ValueError('APIFY_TOKEN environment variable must be set for authentication.')
        # Set the env var that ApifyActorsTool expects
        os.environ['APIFY_API_TOKEN'] = apify_token

        # Charge for Actor start
        await Actor.charge('actor-start')

        # Handle input
        actor_input = await Actor.get_input()

        query = actor_input.get('query')
        model_name = actor_input.get('modelName', 'gpt-4o-mini')
        if not query:
            msg = 'Missing "query" attribute in input!'
            raise ValueError(msg)

        # Create a toolkit for the agent
        # containing the Instagram scraper tool
        tools = [ApifyActorsTool('apify/instagram-scraper')]

        # Create an agent
        # For more information, see https://docs.crewai.com/concepts/agents
        agent = Agent(
            role='Social Media Analytics Expert',
            goal='Analyze and provide insights about social media profiles and content.',
            backstory=(
                'I am an expert social media analyst specializing in Instagram analysis. '
                'I help users understand social media data and extract meaningful insights '
                'from profiles and posts.'
            ),
            tools=tools,
            verbose=True,
            llm=model_name,
        )

        # Create a task assigned to the agent
        # For more information, see https://docs.crewai.com/concepts/tasks
        task = Task(
            description=query,
            expected_output='A helpful response to the user query.',
            agent=agent,
        )

        # Create a one-man crew
        # For more information, see https://docs.crewai.com/concepts/crews
        crew = Crew(agents=[agent], tasks=[task])

        # Kick off the crew and get the response
        crew_output = crew.kickoff()
        raw_response = crew_output.raw

        # Log total token usage
        Actor.log.info('Total tokens used by the model: %s', crew_output.token_usage.total_tokens)

        # Charge for task completion
        await Actor.charge('task-completed')

        # Push results to the dataset
        await Actor.push_data(
            {
                'query': query,
                'response': raw_response,
            }
        )
        Actor.log.info('Pushed the data into the dataset!')
