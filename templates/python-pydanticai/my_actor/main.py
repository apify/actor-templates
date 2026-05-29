"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

from apify import Actor

from .agents import Deps, get_joker_agent


async def main() -> None:
    """Define a main entry point for the Apify Actor."""
    async with Actor:
        # Charge for Actor start
        await Actor.charge('actor-start')
        Actor.log.info('Starting joke generation agent.')

        # Process inputs
        actor_input = await Actor.get_input()

        if not (joke_topic := actor_input.get('jokeTopic')):
            await Actor.fail(status_message='Missing "jokeTopic" attribute in input!')

        model_name = actor_input.get('modelName', 'deepseek/deepseek-v4-flash')

        # Generate joke
        agent = get_joker_agent(model_name)
        joke = (
            await agent.run(user_prompt='Tell me a joke.', deps=Deps(joke_topic=joke_topic, model_name=model_name))
        ).output
        Actor.log.info(f'The AI generated joke about {joke_topic}:\n{joke}')

        # Store the joke
        dataset = await Actor.open_dataset()
        await dataset.push_data({'Topic': joke_topic, 'Joke': joke})

        # Charge for task completion
        await Actor.charge('task-completed')
