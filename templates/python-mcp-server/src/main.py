"""Main entry point for the MCP Server Actor."""

import os

from apify import Actor

from .const import ChargeEvents
from .models import ServerType
from .server import ProxyServer

# Actor configuration
STANDBY_MODE = os.environ.get('APIFY_META_ORIGIN') == 'STANDBY'
# Bind to all interfaces (0.0.0.0) as this is running in a containerized environment (Apify Actor)
# The container's network is isolated, so this is safe
HOST = '0.0.0.0'  # noqa: S104 - Required for container networking at Apify platform
PORT = (Actor.is_at_home() and int(os.environ.get('ACTOR_STANDBY_PORT') or '5001')) or 5001
SERVER_NAME = 'arxiv-mcp-server'

# EDIT THIS SECTION ------------------------------------------------------------
# Configuration constants - You need to override these values. You can also pass environment variables if needed.
# 1) If you are wrapping stdio server type, you need to provide the command and args
from mcp.client.stdio import StdioServerParameters  # noqa: E402

server_type = ServerType.STDIO
MCP_SERVER_PARAMS = StdioServerParameters(
    command='uv',
    args=['run', 'arxiv-mcp-server'],
    env={'YOUR-ENV_VAR': os.getenv('YOUR-ENV-VAR') or ''},  # Optional environment variables
)

# 2) If you are connecting to a Streamable HTTP or SSE server, you need to provide the url and headers if needed
# from .models import RemoteServerParameters  # noqa: ERA001

# server_type = ServerType.HTTP # or ServerType.SSE, depending on your server type # noqa: ERA001
# MCP_SERVER_PARAMS = RemoteServerParameters( # noqa: ERA001, RUF100
#     url='https://your-mcp-server',  # noqa: ERA001
#     headers={'Authorization':  'Bearer YOUR-API-KEY'},  # Optional headers, e.g., for authentication  # noqa: ERA001
# )  # noqa: ERA001, RUF100
# ------------------------------------------------------------------------------


async def main() -> None:
    """Run the MCP Server Actor.

    This function:
    1. Initializes the Actor
    2. Charges for Actor startup
    3. Creates and starts the proxy server
    4. Configures charging for MCP operations using Actor.charge

    CHARGING STRATEGIES:
    The template supports multiple charging approaches:

    1. GENERIC MCP CHARGING:
       - Charge for all tool calls with a flat rate (TOOL_CALL event)
       - Charge for resource operations (RESOURCE_LIST, RESOURCE_READ)
       - Charge for prompt operations (PROMPT_LIST, PROMPT_GET)
       - Charge for tool listing (TOOL_LIST)

    2. DOMAIN-SPECIFIC CHARGING (arXiv example):
       - Charge different amounts for different tools
       - search_papers: $0.01 per search
       - list_papers: $0.001 per listing
       - download_paper: $0.005 per download
       - read_paper: $0.02 per paper read

    3. NO CHARGING:
       - Comment out all charging lines for free service

    Charging events are defined in .actor/pay_per_event.json
    """
    async with Actor:
        # Initialize and charge for Actor startup
        Actor.log.info('Starting MCP Server Actor')
        await Actor.charge(ChargeEvents.ACTOR_START.value)

        if not STANDBY_MODE:
            msg = 'This Actor is not meant to be run directly. It should be run in standby mode.'
            Actor.log.warning(msg)
            await Actor.exit(status_message=msg)
            return

        try:
            # Create and start the server with charging enabled
            url = os.environ.get('ACTOR_STANDBY_URL', HOST)
            Actor.log.info('Starting MCP server')
            Actor.log.info(f'  - proxy server host: {os.environ.get("ACTOR_STANDBY_URL", HOST)}')
            Actor.log.info(f'  - proxy server port: {PORT}')

            Actor.log.info('Add the following configuration to your MCP client to use Streamable HTTP transport:')
            Actor.log.info(
                f"""
                {{
                    "mcpServers": {{
                        "{SERVER_NAME}": {{
                            "url": "{url}/mcp",
                        }}
                    }}
                }}
                """
            )
            # Pass Actor.charge to enable charging for MCP operations
            # The proxy server will use this to charge for different operations
            proxy_server = ProxyServer(SERVER_NAME, MCP_SERVER_PARAMS, HOST, PORT, server_type, actor_charge_function=Actor.charge)
            await proxy_server.start()
        except Exception as e:
            Actor.log.exception(f'Server failed to start: {e}')
            await Actor.exit()
            raise
