"""
This module implements an MCP server that can be used to connect to stdio or SSE based MCP servers.

Heavily inspired by: https://github.com/sparfenyuk/mcp-proxy
"""

import logging

import uvicorn
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from .models import ServerType, ServerParameters, SseServerParameters
from .proxy_server import create_proxy_server
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route

logger = logging.getLogger('apify')


class ProxyServer:
    """Main class implementing the proxy functionality using MCP SDK.

    This proxy is running Starlette app that exposes /sse and /messages/ endpoints.
    It then connects to stdio or SSE based MCP servers and forwards the messages to the client.
    """

    def __init__(self, client_type: ServerType, config: ServerParameters, host: str, port: int):
        self.server_type: ServerType = client_type
        self.config = self._validate_config(client_type, config)
        self.path_sse: str = '/sse'
        self.path_message: str = '/message'
        self.host: str = host
        self.port: int = port

    @staticmethod
    def _validate_config(client_type: ServerType, config: ServerParameters) -> ServerParameters:
        """Validate and return the appropriate server parameters."""
        try:
            if client_type == ServerType.STDIO:
                return StdioServerParameters.model_validate(config)
            elif client_type == ServerType.SSE:
                return SseServerParameters.model_validate(config)
            else:
                raise ValueError(f'Invalid client type: {client_type}')
        except Exception as e:
            raise ValueError(f'Invalid server configuration: {e}')

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

    async def _run_server(self, app: 'Starlette') -> None:
        """Run the Starlette app with uvicorn."""
        config_ = uvicorn.Config(app, host=self.host, port=self.port)
        server = uvicorn.Server(config_)
        await server.serve()

    async def start(self):
        """Start Starlette app (SSE server) and connect to stdio or SSE based MCP server."""
        logger.info(f'Starting MCP server with client type: {self.server_type} and config {self.config}')

        if self.server_type == ServerType.STDIO:
            async with stdio_client(self.config) as streams, ClientSession(*streams) as session:
                mcp_server = await create_proxy_server(session)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)
        elif self.server_type == ServerType.SSE:
            params = self.config.model_dump(exclude_unset=True)
            async with sse_client(**params) as streams, ClientSession(*streams) as session:
                mcp_server = await create_proxy_server(session)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)


async def run():

    server_params = SseServerParameters(
        url='http://localhost:3001/sse',
    )
    server_params = StdioServerParameters(
        command= 'uv',
        args= ['tool', 'run', 'arxiv-mcp-server'],
    )

    proxy_server = ProxyServer(ServerType.STDIO, server_params, 'localhost', 5001)
    await proxy_server.start()


if __name__ == '__main__':
    import asyncio

    asyncio.run(run())
