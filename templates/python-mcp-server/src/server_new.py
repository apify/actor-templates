import asyncio
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.responses import Response
from starlette.routing import Mount, Route

import logging
from enum import Enum
from typing import Callable, TypeAlias

import uvicorn

from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.client.sse import sse_client
from mcp.server import Server
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Optional, Dict, Literal
import httpx
from datetime import datetime, timezone, timedelta

from proxy_server import create_proxy_server


class ClientType(str, Enum):
    """Type of client connection."""

    STDIO = 'stdio'  # Connect to a stdio server
    SSE = 'sse'  # Connect to an SSE server



# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class SseServerParameters(BaseModel):
    url: str
    headers: dict[str, Any] | None = None
    timeout: float = 5  # Default timeout for SSE connection
    sse_read_timeout: float = 60 * 5 # Default read timeout for SSE connection
    auth: httpx.Auth | None = None
    model_config = ConfigDict(arbitrary_types_allowed=True)

# Type alias for server parameters
ServerParameters: TypeAlias = StdioServerParameters | SseServerParameters

class ProxyServer:
    """Main class implementing the proxy functionality using MCP SDK.

    This proxy server is used to connect to stdio or SSE based MCP servers.
    """

    def __init__(self, client_type: ClientType, config: ServerParameters):
        self.config = config
        self.client_type: ClientType = client_type
        self.path_sse: str = '/sse'
        self.path_message: str = '/message'
        self.starlette_app: 'Starlette' = None

    async def start(self):
        """Start local SSE server and connect to stdio or SSE based MCP server."""

        # Server mode
        logger.info(f'Starting MCP server')
        if self.client_type.value == ClientType.STDIO.value:
            stdio_params = StdioServerParameters.model_validate(self.config)
            async with stdio_client(stdio_params) as streams, ClientSession(*streams) as session:
                mcp_server = await create_proxy_server(session)
                starlette_app = await self.create_starlette_app(mcp_server)
                await self.run_server(starlette_app)
        elif self.client_type.value == ClientType.SSE.value:
            sse_params = SseServerParameters.model_validate(self.config).model_dump()
            async with sse_client(**sse_params) as streams, ClientSession(*streams) as session:
                mcp_server = await create_proxy_server(session)
                starlette_app = await self.create_starlette_app(mcp_server)
                await self.run_server(starlette_app)
        else:
            raise ValueError(f'Invalid client type: {self.client_type}')

    async def create_starlette_app(self, app: Server) -> 'Starlette':
        """Create a Starlette app that serves the MCP server over SSE."""
        sse = SseServerTransport('/messages/')

        async def handle_sse(request):
            async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
                logger.info(f'Starting server with name: {app.name}, version: {app.version}')
                init_options = app.create_initialization_options()
                logger.info(f'Initialization options: {init_options}')
                await app.run(streams[0], streams[1], init_options)
            return Response()

        starlette_app = Starlette(
            debug=True,
            routes=[
                Route('/sse', endpoint=handle_sse, methods=['GET']),
                Mount('/messages/', app=sse.handle_post_message),
            ],
        )
        return starlette_app

    async def run_server(self, app: 'Starlette') -> None:
        """Run the Starlette app with uvicorn."""
        config_ = uvicorn.Config(app, host='localhost', port=50001)
        server = uvicorn.Server(config_)
        await server.serve()


async def run():
    # Choose which server mode to run
    # asyncio.run(run_with_client())
    # # Configuration for the remote MCP server
    # config = {
    #     'args': ['tool', 'run', 'arxiv-mcp-server'],
    #     'env': {
    #         'MCP_SERVER_NAME': 'arxiv-mcp-server',
    #         'MCP_SERVER_DESCRIPTION': 'Arxiv MCP Server',
    #         'MCP_SERVER_VERSION': '1.0.0',
    #     },
    # }
    # server_params = StdioServerParameters(
    #     command='uv',
    #     args=config.get("args"),
    #     env=config.get("env"),
    # )
    # proxy_server = ProxyServer(ClientType.STDIO, server_params)
    # await proxy_server.start()

    server_params = SseServerParameters(
        url = 'http://localhost:3001/mcp',
    )
    proxy_server = ProxyServer(ClientType.SSE, server_params)
    await proxy_server.start()

# async def run_with_client(client: Callable, params) -> None:
#     """Run the proxy as an HTTP/SSE server.
#     """
#     logger.info("Starting MCP proxy server with HTTP/SSE transport")
#     async with client(server_params) as streams, ClientSession(*streams) as session:
#         logger.info("Connected to remote MCP server")
#         server = await create_proxy_server(session)
#         starlette_app = await create_starlette_app(server)
#         await run_server(starlette_app)


if __name__ == '__main__':
    import asyncio
    asyncio.run(run())

