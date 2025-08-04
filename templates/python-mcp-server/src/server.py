"""Module implementing an MCP server that can be used to connect to stdio or SSE based MCP servers.

Heavily inspired by: https://github.com/sparfenyuk/mcp-proxy
"""

from __future__ import annotations

import contextlib
import logging
from typing import TYPE_CHECKING, Any

import httpx
import uvicorn
from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.client.streamable_http import streamablehttp_client
from mcp.server.sse import SseServerTransport
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from pydantic import ValidationError
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, RedirectResponse, Response
from starlette.routing import Mount, Route

from .event_store import InMemoryEventStore
from .models import RemoteServerParameters, ServerParameters, ServerType
from .proxy_server import create_proxy_server

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Awaitable, Callable

    from mcp.server import Server
    from starlette import types as st
    from starlette.requests import Request
    from starlette.types import Receive, Scope, Send

logger = logging.getLogger('apify')


class McpPathRewriteMiddleware(BaseHTTPMiddleware):
    """Add middleware to rewrite /mcp to /mcp/ to ensure consistent path handling.

    This is necessary so that Starlette does not return a 307 Temporary Redirect on the /mcp path,
    which would otherwise trigger the OAuth flow when the MCP server is deployed on the Apify platform.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Any:
        """Rewrite the request path."""
        if request.url.path == '/mcp':
            request.scope['path'] = '/mcp/'
            request.scope['raw_path'] = b'/mcp/'
        return await call_next(request)


class ProxyServer:
    """Main class implementing the proxy functionality using MCP SDK.

    This proxy runs a Starlette app that exposes /sse and /messages/ endpoints for legacy SSE transport,
            and a /mcp endpoint for Streamable HTTP transport.
    It then connects to stdio or remote MCP servers and forwards the messages to the client.

    The server can optionally charge for operations using a provided charging function.
    This is typically used in Apify Actors to charge users for MCP operations.
    The charging function should accept an event name and optional parameters.
    """

    def __init__(
        self,
        config: ServerParameters,
        host: str,
        port: int,
        server_type: ServerType,
        actor_charge_function: Callable[[str, int], Awaitable[Any]] | None = None,
    ) -> None:
        """Initialize the proxy server.

        Args:
            config: Server configuration (stdio or SSE parameters)
            host: Host to bind the server to
            port: Port to bind the server to
            server_type: Type of server to connect (stdio, SSE, or HTTP)
            actor_charge_function: Optional function to charge for operations.
                           Should accept (event_name: str, count: int).
                           Typically, Actor.charge in Apify Actors.
                           If None, no charging will occur.
        """
        self.server_type = server_type
        self.config = self._validate_config(self.server_type, config)
        self.path_sse: str = '/sse'
        self.path_message: str = '/message'
        self.host: str = host
        self.port: int = port
        self.actor_charge_function = actor_charge_function

    @staticmethod
    def _validate_config(client_type: ServerType, config: ServerParameters) -> ServerParameters | None:
        """Validate and return the appropriate server parameters."""
        try:
            match client_type:
                case ServerType.STDIO:
                    return StdioServerParameters.model_validate(config)
                case ServerType.SSE | ServerType.HTTP:
                    return RemoteServerParameters.model_validate(config)
                case _:
                    raise ValueError(f'Unsupported server type: {client_type}')
        except ValidationError as e:
            raise ValueError(f'Invalid server configuration: {e}') from e

    @staticmethod
    async def create_starlette_app(mcp_server: Server) -> Starlette:
        """Create a Starlette app (SSE server) that exposes /sse and /messages/ endpoints."""
        transport = SseServerTransport('/messages/')  # Only used for legacy SSE transport
        event_store = InMemoryEventStore()
        session_manager = StreamableHTTPSessionManager(
            app=mcp_server,
            event_store=event_store,  # Enable resume ability for Streamable HTTP connections
            json_response=False,
        )

        @contextlib.asynccontextmanager
        async def lifespan(_app: Starlette) -> AsyncIterator[None]:
            """Context manager for managing session manager lifecycle."""
            async with session_manager.run():
                logger.info('Application started with StreamableHTTP session manager!')
                try:
                    yield
                finally:
                    logger.info('Application shutting down...')

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
                    'transport': 'sse+streamable-http',
                    'endpoints': {
                        'sse': '/sse',
                        'messages': '/messages/',
                        'streamableHttp': '/mcp',
                    },
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
            # Add Response to prevent the None type error
            return Response(status_code=204)  # No content response

        async def handle_favicon(_request: Request) -> st.Response:
            """Handle favicon.ico requests by redirecting to Apify's favicon."""
            return RedirectResponse(url='https://apify.com/favicon.ico', status_code=301)

        async def handle_oauth_authorization_server(_request: Request) -> st.Response:
            """Handle OAuth authorization server well-known endpoint."""
            try:
                # Some MCP clients do not follow redirects, so we need to fetch the data and return it directly.
                async with httpx.AsyncClient() as client:
                    response = await client.get('https://api.apify.com/.well-known/oauth-authorization-server')
                    response.raise_for_status()
                    data = response.json()
                return JSONResponse(data, status_code=200)
            except Exception:
                logger.exception('Error fetching OAuth authorization server data')
                return JSONResponse({'error': 'Failed to fetch OAuth authorization server data'}, status_code=500)

        # ASGI handler for Streamable HTTP connections
        async def handle_streamable_http(scope: Scope, receive: Receive, send: Send) -> None:
            await session_manager.handle_request(scope, receive, send)

        return Starlette(
            debug=True,
            routes=[
                Route('/', endpoint=handle_root),
                Route('/favicon.ico', endpoint=handle_favicon, methods=['GET']),
                Route(
                    '/.well-known/oauth-authorization-server',
                    endpoint=handle_oauth_authorization_server,
                    methods=['GET'],
                ),
                Route('/sse', endpoint=handle_sse, methods=['GET']),
                Mount('/messages/', app=transport.handle_post_message),
                Mount('/mcp/', app=handle_streamable_http),
            ],
            lifespan=lifespan,
            middleware=[Middleware(McpPathRewriteMiddleware)],
        )

    async def _run_server(self, app: Starlette) -> None:
        """Run the Starlette app with uvicorn."""
        config_ = uvicorn.Config(app, host=self.host, port=self.port, log_level='info', access_log=True)
        server = uvicorn.Server(config_)
        await server.serve()

    async def start(self) -> None:
        """Start Starlette app and connect to stdio, Streamable HTTP, or SSE based MCP server."""
        logger.info(f'Starting MCP server with client type: {self.server_type} and config {self.config}')
        params: dict = (self.config and self.config.model_dump(exclude_unset=True)) or {}

        if self.server_type in (ServerType.STDIO, ServerType.SSE):
            async with (
                stdio_client(**params) as (read_stream, write_stream),
                ClientSession(read_stream, write_stream) as session,
            ):
                mcp_server = await create_proxy_server(session, self.actor_charge_function)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)

        elif self.server_type == ServerType.HTTP:
            # HTTP streamable server needs to unpack three parameters
            async with (
                streamablehttp_client(**params) as (read_stream, write_stream, _),
                ClientSession(read_stream, write_stream) as session,
            ):
                mcp_server = await create_proxy_server(session, self.actor_charge_function)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)
        else:
            raise ValueError(f'Unknown server type: {self.server_type}')
