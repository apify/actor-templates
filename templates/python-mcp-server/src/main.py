"""
ArXiv MCP Server - main entry point for the Apify Actor.

This file serves as the entry point for the ArXiv MCP Server Actor.
It sets up a proxy server that forwards requests to the locally running
ArXiv MCP server, which provides a Model Context Protocol (MCP) interface
for AI assistants to search and access arXiv papers.
"""

import os
import asyncio
import logging

from apify import Actor

# Configuration constants for the MCP server
# TODO: Replace with the actual command to run the MCP server
MCP_COMMAND = 'uv tool run arxiv-mcp-server'

# Check if the Actor is running in standby mode
STANDBY_MODE = os.environ.get('APIFY_META_ORIGIN') == 'STANDBY'
SERVER_PORT = int(os.environ.get('ACTOR_WEB_SERVER_PORT', '8000'))

# Logger configuration
LOG_LEVEL = logging.getLevelName(os.environ.get('INFO'))
OUTPUT_TRANSPORT = 'sse'

async def main() -> None:
    """Define a main entry point for the Apify Actor."""
    async with Actor:
        # Initialize and charge
        Actor.log.info('Starting MCP Server Actor')
        await Actor.charge('actor-start')

        if not STANDBY_MODE:
            msg = 'This Actor is not meant to be run directly. It should be run in standby mode.'
            Actor.log.error(msg)
            await Actor.exit()
            return

        from server import StdioToSse, StdioToSseArgs
        server = StdioToSse(StdioToSseArgs(
            stdio_cmd=MCP_COMMAND,
            port=SERVER_PORT,
            logger=Actor.log
        ))
        await server.start()

if __name__ == '__main__':
    asyncio.run(main())
