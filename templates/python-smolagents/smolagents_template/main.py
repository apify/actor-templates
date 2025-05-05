"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

import os
import sys
from io import TextIOWrapper

from apify import Actor
from smolagents import CodeAgent, DuckDuckGoSearchTool, OpenAIServerModel

# Configure stdout to use UTF-8 encoding for proper unicode support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    # Fall back to TextIOWrapper for environments where reconfigure is unavailable
    sys.stdout = TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_API_BASE = 'https://api.openai.com/v1'


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        # Retrieve input parameters from the Apify Actor configuration
        actor_input = await Actor.get_input() or {}

        model = actor_input.get('model')
        if not model:
            raise ValueError('Missing "model" attribute in Actor input!')

        user_interests = actor_input.get('interests')
        if not user_interests:
            raise ValueError('Missing "interests" attribute in Actor input!')

        # Initialize the OpenAI model for text processing
        model = OpenAIServerModel(
            model_id=model,
            api_base=OPENAI_API_BASE,
            api_key=OPENAI_API_KEY,
        )

        # Create the search tool and AI agent
        search_tool = DuckDuckGoSearchTool()
        agent = CodeAgent(tools=[search_tool], model=model)

        # Construct a query using user-defined interests
        query = f'Give me latest news on {", ".join(user_interests)}'

        # Use the agent to fetch search results
        search_results = agent.run(query)
        Actor.log.info('News search operation completed successfully.')

        # Generate a summary of the retrieved news articles
        summary_prompt = f'Summarize the following news articles: {search_results}'
        summary = agent.run(summary_prompt)
        Actor.log.info('News summarization operation completed successfully.')

        # Push the results to the dataset by wrapping it in an object.
        Actor.log.info('The results will be stored in the dataset.')
        await Actor.push_data({'summary': summary})
