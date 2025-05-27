"""
MCP Server - main entry point for the Apify Actor.

This file serves as the entry point for the MCP Server Actor.

It sets up a proxy server that forwards requests to different types of MCP servers (stdio or SSE) while providing a unified SSE interface.

You need to override the MCP_SERVER_TYPE and MCP_SERVER_CONFIG variables to configure the MCP server.
"""

import asyncio
import os

from apify import Actor

from .server import ProxyServer, StdioServerParameters

STANDBY_MODE = os.environ.get('APIFY_META_ORIGIN') == 'STANDBY'
HOST = Actor.is_at_home() and os.environ.get('ACTOR_STANDBY_URL') or 'localhost'
PORT = Actor.is_at_home() and int(os.environ.get('ACTOR_STANDBY_PORT')) or 5001


# EDIT THIS SECTION ------------------------------------------------------------
# Configuration constants - You need to override these values
# 1) For stdio server type, you need to provide the command and args
MCP_SERVER_PARAMS = StdioServerParameters(
    command='uv',
    args=['tool', 'run', 'arxiv-mcp-server'],
)

# 2) For SSE server type, you need to provide the url
# MCP_SERVER_PARAMS = SseServerParameters(
#     url='https://your-remote-server-url/sse',
# )
# ------------------------------------------------------------------------------


async def main() -> None:
    """Main entry point for the MCP Server Actor."""
    async with Actor:
        # Initialize and charge
        Actor.log.info('Starting MCP Server Actor')
        await Actor.charge('actor-start')

        if not STANDBY_MODE:
            msg = 'This Actor is not meant to be run directly. It should be run in standby mode.'
            Actor.log.error(msg)
            await Actor.exit(status_message=msg)
            return

        try:
            # Create and start the server
            Actor.log.info(f'Starting MCP proxy server')
            Actor.log.info(f'  - proxy server host: {HOST}')
            Actor.log.info(f'  - proxy server port: {PORT}')

            proxy_server = ProxyServer(MCP_SERVER_PARAMS, HOST, PORT)
            await proxy_server.start()
        except Exception as e:
            Actor.log.error(f'Server failed to start: {e}')
            await Actor.exit()
            raise


if __name__ == '__main__':
    asyncio.run(main())
