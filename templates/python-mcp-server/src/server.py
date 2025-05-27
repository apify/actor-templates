"""
This module implements a MCP server that can be used to connect to stdio or SSE based MCP servers.

Heavily inspired by: https://github.com/sparfenyuk/mcp-proxy
"""

from starlette.requests import Request
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Mount, Route

import logging
from starlette.responses import JSONResponse, Response
from enum import Enum
from typing import TypeAlias

import uvicorn

from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.client.sse import sse_client
from mcp.server import Server
from pydantic import BaseModel, ConfigDict
from typing import Any
import httpx

from proxy_server import create_proxy_server


class ClientType(str, Enum):
    """Type of client connection."""

    STDIO = 'stdio'  # Connect to a stdio server
    SSE = 'sse'  # Connect to an SSE server


logger = logging.getLogger('apify')


class SseServerParameters(BaseModel):
    url: str
    headers: dict[str, Any] | None = None
    timeout: float = 5  # Default timeout for SSE connection
    sse_read_timeout: float = 60 * 5  # Default read timeout for SSE connection
    auth: httpx.Auth | None = None
    model_config = ConfigDict(arbitrary_types_allowed=True)


# Type alias for server parameters
ServerParameters: TypeAlias = StdioServerParameters | SseServerParameters


class ProxyServer:
    """Main class implementing the proxy functionality using MCP SDK.

    This proxy is running Starlette app that exposes /sse and /messages/ endpoints.
    It then connects to stdio or SSE based MCP servers and forwards the messages to the client.
    """

    def __init__(self, client_type: ClientType, config: ServerParameters):
        self.client_type: ClientType = client_type
        self.config = self._validate_config(client_type, config)
        self.path_sse: str = '/sse'
        self.path_message: str = '/message'

    @staticmethod
    def _validate_config(client_type: ClientType, config: ServerParameters) -> ServerParameters:
        """Validate and return the appropriate server parameters."""
        if client_type == ClientType.STDIO:
            return StdioServerParameters.model_validate(config)
        elif client_type == ClientType.SSE:
            return SseServerParameters.model_validate(config)
        else:
            raise ValueError(f'Invalid client type: {client_type}')

    @staticmethod
    async def create_starlette_app(mcp_server: Server) -> 'Starlette':
        """Create a Starlette app (SSE server) that exposes /sse and /messages/ endpoints."""
        transport = SseServerTransport('/messages/')

        async def handle_root(request: Request) -> Response:
            """Handle root endpoint."""
            # Handle Apify standby readiness probe
            if 'x-apify-container-server-readiness-probe' in request.headers:
                return Response(
                    content=b'ok',
                    media_type='text/plain',
                    status_code=200,
                )

            return JSONResponse(
                {
                    'status': 'running',
                    'type': 'mcp-server',
                    'transport': 'sse',
                    'endpoints': {'sse': '/sse', 'messages': '/messages/'},
                }
            )

        async def handle_sse(request):
            """Handle incoming SSE requests."""
            try:
                async with transport.connect_sse(request.scope, request.receive, request._send) as streams:
                    logger.info(f'Starting server with name: {mcp_server.name}, version: {mcp_server.version}')
                    init_options = mcp_server.create_initialization_options()
                    logger.info(f'Initialization options: {init_options}')
                    await mcp_server.run(streams[0], streams[1], init_options)
            except Exception as e:
                logger.error(f'Error in SSE connection: {e}')
                return Response(status_code=500, content=str(e))
            finally:
                logger.info('SSE connection closed')
                return Response()

        return Starlette(
            debug=True,
            routes=[
                Route('/', endpoint=handle_root),
                Route('/sse', endpoint=handle_sse, methods=['GET']),
                Mount('/messages/', app=transport.handle_post_message),
            ],
        )

    @staticmethod
    async def _run_server(app: 'Starlette') -> None:
        """Run the Starlette app with uvicorn."""
        config_ = uvicorn.Config(app, host='localhost', port=50001)
        server = uvicorn.Server(config_)
        await server.serve()

    async def start(self):
        """Start Starlette app (SSE server) and connect to stdio or SSE based MCP server."""
        logger.info(f'Starting MCP server with client type: {self.client_type}')
        client = stdio_client if self.client_type == ClientType.STDIO else sse_client
        client_params = self.config.model_dump() if self.client_type == ClientType.SSE else self.config

        async with client(**client_params) as streams, ClientSession(*streams) as session:
            mcp_server = await create_proxy_server(session)
            app = await self.create_starlette_app(mcp_server)
            await self._run_server(app)


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
        url='http://localhost:3001/sse',
    )
    proxy_server = ProxyServer(ClientType.SSE, server_params)
    await proxy_server.start()

if __name__ == '__main__':
    import asyncio

    asyncio.run(run())
