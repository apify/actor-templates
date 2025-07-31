"""Main entry point for the MCP Server Actor."""

import os

from apify import Actor

from .const import ChargeEvents
from .server import ProxyServer

# Actor configuration
STANDBY_MODE = os.environ.get('APIFY_META_ORIGIN') == 'STANDBY'
# Bind to all interfaces (0.0.0.0) as this is running in a containerized environment (Apify Actor)
# The container's network is isolated, so this is safe
HOST = '0.0.0.0'  # noqa: S104 - Required for container networking in Apify platform
PORT = (Actor.is_at_home() and int(os.environ.get('ACTOR_STANDBY_PORT'))) or 5001

# EDIT THIS SECTION ------------------------------------------------------------
# Configuration constants - You need to override these values. You can also pass environment variables if needed.
# 1) For stdio server type, you need to provide the command and args
from mcp.client.stdio import StdioServerParameters  # noqa: E402

#MCP_SERVER_PARAMS = StdioServerParameters(
#    command='uv',
#    args=['run', 'arxiv-mcp-server'],
#    env={'YOUR-ENV_VAR': os.getenv('YOUR-ENV-VAR') or ''},  # Optional environment variables
#)

# 2) For a remote server, you can use the mcp-remote MCP server wrapper. You can also specify headers if needed, such as Authorization.
MCP_SERVER_PARAMS = StdioServerParameters(
    command='npx',
    args=['mcp-remote', 'https://mcp.apify.com',
           '--header', 'Authorization: Bearer YOUR_APIFY_TOKEN'],
)
# ------------------------------------------------------------------------------


async def main() -> None:
    """Run the MCP Server Actor.

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
            Actor.log.info('Starting MCP proxy server')
            Actor.log.info(f'  - proxy server host: {os.environ.get("ACTOR_STANDBY_URL", HOST)}')
            Actor.log.info(f'  - proxy server port: {PORT}')

            Actor.log.info('Put this in your client config to use streamable HTTP transport:')
            Actor.log.info(
                f"""
                {{
                    "mcpServers": {{
                        "arxiv-mcp-server": {{
                            "url": "{url}/mcp",
                        }}
                    }}
                }}
                """
            )
            Actor.log.info('Put this in your client config to use legacy SSE transport:')
            Actor.log.info(
                f"""
                {{
                    "mcpServers": {{
                        "arxiv-mcp-server": {{
                            "url": "{url}/sse",
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
