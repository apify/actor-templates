"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

from typing import Any

import uvicorn
from apify import Actor, Event

from .app import create_app
from .run_pool import get_run_pool


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also lets the server handle
    many requests at once.
    """
    async with Actor:
        # Find out which users this run serves. See my_actor/run_pool.py for what each pool means for billing.
        pool = await get_run_pool()
        Actor.log.info(
            f'This run serves the {pool} pool' if pool else 'This run was not started through the server interface'
        )

        # Finish the run with a success exit code. The app calls this when the spending limit of a single-tenant run
        # is reached. The server stops accepting requests and lets the ones in progress finish first.
        def finish_run() -> None:
            Actor.status_message = 'The run finished because its spending limit is reached.'
            server.should_exit = True

        # Listen on the port the platform routes requests to (ACTOR_WEB_SERVER_PORT).
        # Bind to all interfaces, because the server runs in a container and the platform connects from outside it.
        config = uvicorn.Config(
            create_app(pool, finish_run),
            host='0.0.0.0',  # noqa: S104
            port=Actor.configuration.web_server_port,
        )
        server = uvicorn.Server(config)

        # Stop quickly when the platform aborts the run.
        async def stop_server(_event_data: Any) -> None:
            server.should_exit = True

        Actor.on(Event.ABORTING, stop_server)

        await server.serve()
