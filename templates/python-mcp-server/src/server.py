"""Module implementing an MCP server that can be used to connect to stdio or SSE based MCP servers.

Heavily inspired by: https://github.com/sparfenyuk/mcp-proxy
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Callable

import uvicorn
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route

from .models import ServerParameters, ServerType, SseServerParameters
from .proxy_server import create_proxy_server

if TYPE_CHECKING:
    from mcp.server import Server
    from starlette import types as st
    from starlette.requests import Request

logger = logging.getLogger('apify')


class ProxyServer:
    """Main class implementing the proxy functionality using MCP SDK.

    This proxy is running Starlette app that exposes /sse and /messages/ endpoints.
    It then connects to stdio or SSE based MCP servers and forwards the messages to the client.

    The server can optionally charge for operations using a provided charging function.
    This is typically used in Apify Actors to charge users for MCP operations.
    The charging function should accept an event name and optional parameters.
    """

    def __init__(
        self,
        config: ServerParameters,
        host: str,
        port: int,
        actor_charge_function: Callable[[str, int], None] | None = None,
    ) -> None:
        """Initialize the proxy server.

        Args:
            config: Server configuration (stdio or SSE parameters)
            host: Host to bind the server to
            port: Port to bind the server to
            actor_charge_function: Optional function to charge for operations.
                           Should accept (event_name: str, count: int).
                           Typically, Actor.charge in Apify Actors.
                           If None, no charging will occur.
        """
        self.server_type = ServerType.STDIO if isinstance(config, StdioServerParameters) else ServerType.SSE
        self.config = self._validate_config(self.server_type, config)
        self.path_sse: str = '/sse'
        self.path_message: str = '/message'
        self.host: str = host
        self.port: int = port
        self.actor_charge_function = actor_charge_function

    @staticmethod
    def _validate_config(client_type: ServerType, config: ServerParameters) -> ServerParameters:
        """Validate and return the appropriate server parameters."""

        def validate_and_return() -> ServerParameters:
            if client_type == ServerType.STDIO:
                return StdioServerParameters.model_validate(config)
            if client_type == ServerType.SSE:
                return SseServerParameters.model_validate(config)
            raise ValueError(f'Invalid client type: {client_type}')

        try:
            return validate_and_return()
        except Exception as e:
            raise ValueError(f'Invalid server configuration: {e}') from e

    @staticmethod
    async def create_starlette_app(mcp_server: Server) -> Starlette:
        """Create a Starlette app (SSE server) that exposes /sse and /messages/ endpoints."""
        transport = SseServerTransport('/messages/')

        async def handle_root(request: Request) -> st.Response:
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

        async def handle_sse(request: st.Request) -> st.Response | None:
            """Handle incoming SSE requests."""
            try:
                async with transport.connect_sse(request.scope, request.receive, request._send) as streams:  # noqa: SLF001
                    init_options = mcp_server.create_initialization_options()
                    await mcp_server.run(streams[0], streams[1], init_options)
            except Exception as e:
                logger.exception('Error in SSE connection')
                return Response(status_code=500, content=str(e))
            finally:
                logger.info('SSE connection closed')

        return Starlette(
            debug=True,
            routes=[
                Route('/', endpoint=handle_root),
                Route('/sse', endpoint=handle_sse, methods=['GET']),
                Mount('/messages/', app=transport.handle_post_message),
            ],
        )

    async def _run_server(self, app: Starlette) -> None:
        """Run the Starlette app with uvicorn."""
        config_ = uvicorn.Config(
            app,
            host=self.host,
            port=self.port,
            log_level='info',
            access_log=True,
        )
        server = uvicorn.Server(config_)
        await server.serve()

    async def _initialize_and_run_server(self, client_session_factory: Any, **client_params: dict) -> None:
        """Initialize and run the server."""
        async with client_session_factory(**client_params) as streams, ClientSession(*streams) as session:
            mcp_server = await create_proxy_server(session, self.actor_charge_function)
            app = await self.create_starlette_app(mcp_server)
            await self._run_server(app)

    async def start(self) -> None:
        """Start Starlette app (SSE server) and connect to stdio or SSE based MCP server."""
        logger.info(f'Starting MCP server with client type: {self.server_type} and config {self.config}')

        if self.server_type == ServerType.STDIO:
            logger.info(f'Starting and connecting to stdio based MCP server with config {self.config}')
            await self._initialize_and_run_server(stdio_client, server=self.config)
        elif self.server_type == ServerType.SSE:
            logger.info(f'Connecting to SSE based MCP server with config {self.config}')
            params = self.config.model_dump(exclude_unset=True)
            await self._initialize_and_run_server(sse_client, **params)
