"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

import sys

from apify import Actor


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with the Apify platform.

    This is a minimal, general-purpose Actor: it reads an input, does a little work with it, logs its progress, and
    stores a result in the dataset. Replace the body with whatever your Actor should do, for example a scraper, a
    browser automation, an AI agent, an MCP server, or a web server.
    """
    async with Actor:
        # uv manages both the dependencies and the Python version, so the interpreter running here is exactly the
        # one pinned in `.python-version`.
        python_version = '.'.join(map(str, sys.version_info[:3]))
        Actor.log.info(f'Hello from a uv-managed Apify Actor, running on Python {python_version}!')

        # Retrieve the Actor input. The structure of the input is defined in `input_schema.json`.
        actor_input = await Actor.get_input() or {}
        name = actor_input.get('name', 'world')
        repeat = actor_input.get('repeat', 3)

        # Do something with the input. Here we simply greet the given name a few times.
        for i in range(1, repeat + 1):
            Actor.log.info(f'[{i}/{repeat}] Hello, {name}!')

        # Save a structured result to the dataset, which is a table-like storage.
        await Actor.push_data(
            {
                'greeting': f'Hello, {name}!',
                'repeated': repeat,
                'python_version': python_version,
                'managed_by': 'uv',
            }
        )
