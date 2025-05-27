"""
MCP Server - main entry point for the Apify Actor.

This file serves as the entry point for the MCP Server Actor.

It sets up a proxy server that forwards requests to different types of MCP servers (stdio or SSE)
while providing a unified SSE interface. The server can optionally charge for operations using
Apify's charging system.

You need to override the MCP_SERVER_TYPE and MCP_SERVER_CONFIG variables to configure the MCP server.
"""

import asyncio
import os

from apify import Actor

from .const import ChargeEvents
from .server import ProxyServer

STANDBY_MODE = os.environ.get('APIFY_META_ORIGIN') == 'STANDBY'
HOST = '0.0.0.0'  # Bind to all interfaces (don't use ACTOR_STANDBY_URL)
PORT = Actor.is_at_home() and int(os.environ.get('ACTOR_STANDBY_PORT')) or 5001

# EDIT THIS SECTION ------------------------------------------------------------
# Configuration constants - You need to override these values. You can also pass environment variables if needed.
# 1) For stdio server type, you need to provide the command and args
from mcp.client.stdio import StdioServerParameters

MCP_SERVER_PARAMS = StdioServerParameters(
    command='uv',
    args=['run', 'arxiv-mcp-server'],
)

# 2) For SSE server type, you need to provide the url, you can also specify headers if needed with Authorization
# from .models import SseServerParameters
#
# MCP_SERVER_PARAMS = SseServerParameters(
#     url='http://localhost:3001/sse',
# )
# ------------------------------------------------------------------------------


async def main() -> None:
    """Main entry point for the MCP Server Actor.

    This function:
    1. Initializes the Actor
    2. Charges for Actor startup
    3. Creates and starts the proxy server
    4. Configures charging for MCP operations using Actor.charge

    The proxy server will charge for different MCP operations like:
    - Tool calls
    - Prompt operations
    - Resource access
    - List operations

    Charging events are defined in .actor/pay_per_event.json
    """
    async with Actor:
        # Initialize and charge for Actor startup
        Actor.log.info('Starting MCP Server Actor')
        await Actor.charge(ChargeEvents.ACTOR_START.value)

        if not STANDBY_MODE:
            msg = 'This Actor is not meant to be run directly. It should be run in standby mode.'
            Actor.log.error(msg)
            await Actor.exit(status_message=msg)
            return

        try:
            # Create and start the server with charging enabled
            url = os.environ.get('ACTOR_STANDBY_URL', HOST)
            Actor.log.info(f'Starting MCP proxy server')
            Actor.log.info(f'  - proxy server host: {os.environ.get("ACTOR_STANDBY_URL", HOST)}')
            Actor.log.info(f'  - proxy server port: {PORT}')

            Actor.log.info('Put this in your client config:')
            Actor.log.info(
                f"""
                {{
                    "mcpServers": {{
                        "arxiv-mcp-server": {{
                            "url": "{url}/sse"
                        }}
                    }}
                }}
                """
            )
            # Pass Actor.charge to enable charging for MCP operations
            # The proxy server will use this to charge for different operations
            proxy_server = ProxyServer(MCP_SERVER_PARAMS, HOST, PORT, actor_charge_function=Actor.charge)
            await proxy_server.start()
        except Exception as e:
            Actor.log.exception(f'Server failed to start: {e}')
            await Actor.exit()
            raise


if __name__ == '__main__':
    asyncio.run(main())
