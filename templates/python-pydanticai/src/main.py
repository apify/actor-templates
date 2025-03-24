"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import os

from apify import Actor

from src.agents import Deps, get_joker_agent


async def main() -> None:
    """Define a main entry point for the Apify Actor."""
    async with Actor:
        # Charge for Actor start
        await Actor.charge('actor-start')
        Actor.log.info('Starting joke generation agent.')

        # Process inputs
        actor_input = await Actor.get_input()
        os.environ['OPENAI_API_KEY'] = actor_input.get('openAIApiKey', '') or os.environ['OPENAI_API_KEY']
        if not (joke_topic := actor_input.get('jokeTopic')):
            await Actor.fail('Missing "jokeTopic" attribute in input!')

        # Generate joke
        joke = (await get_joker_agent().run(user_prompt='Tell me a joke.', deps=Deps(joke_topic=joke_topic))).data
        Actor.log.info(f'The AI generated joke about {joke_topic}:\n{joke}')

        # Store the joke
        dataset = await Actor.open_dataset()
        await dataset.push_data({'Topic': joke_topic, 'Joke': joke})

        # Charge for task completion
        await Actor.charge('task-completed')
