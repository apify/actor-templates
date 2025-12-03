"""Module implementing an MCP server that can be used to connect to stdio or SSE based MCP servers.

Heavily inspired by: https://github.com/sparfenyuk/mcp-proxy
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
from typing import TYPE_CHECKING, Any

import httpx
import uvicorn
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.client.streamable_http import streamablehttp_client
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from pydantic import ValidationError
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse, Response
from starlette.routing import Mount, Route

from .const import SESSION_TIMEOUT_SECS
from .event_store import InMemoryEventStore
from .mcp_gateway import create_gateway
from .models import RemoteServerParameters, ServerParameters, ServerType

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Awaitable, Callable

    from mcp.server import Server
    from starlette import types as st
    from starlette.types import Receive, Scope, Send

logger = logging.getLogger('apify')


def is_html_browser(request: Request) -> bool:
    """Detect if the request is from an HTML browser based on Accept header."""
    accept_header = request.headers.get('accept', '')
    return 'text/html' in accept_header


def get_html_page(server_name: str, mcp_url: str) -> str:
    """Generate simple HTML page with server URL and MCP client link."""
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{server_name}</title>
    <style>
        body {{ font-family: system-ui; max-width: 500px; margin: 2rem auto; padding: 1rem; }}
        h1 {{ color: #2563eb; margin-bottom: 1rem; }}
        .url {{ background: #f3f4f6; padding: 0.75rem; border-radius: 6px; font-family: monospace;
        word-break: break-all; }}
        pre {{ background: #f9fafb; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.9rem; }}
    </style>
</head>
<body>
    <h1>{server_name}</h1>
    <p><strong>MCP endpoint URL:</strong></p>
    <div class="url">{mcp_url}</div>

    <p><strong>Add to your MCP client (e.g. VS code):</strong></p>
    <pre>{{
  "mcpServers": {{
    "{server_name.lower().replace(' ', '-')}": {{
      "type": "http",
      "url": "{mcp_url}",
      "headers": {{
        "Authorization": "Bearer YOUR_APIFY_TOKEN"
      }}
    }}
  }}
}}</pre>
</body>
</html>"""


def serve_html_page(server_name: str, mcp_url: str) -> Response:
    """Serve HTML page for browser requests."""
    html = get_html_page(server_name, mcp_url)
    return Response(content=html, media_type='text/html')


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

    This proxy runs a Starlette app that exposes a /mcp endpoint for Streamable HTTP transport.
    It then connects to stdio or remote MCP servers and forwards the messages to the client.
    Note: SSE endpoint serving has been deprecated, but SSE client connections are still supported.

    The server can optionally charge for operations using a provided charging function.
    This is typically used in Apify Actors to charge users for MCP operations.
    The charging function should accept an event name and optional parameters.
    """

    def __init__(  # noqa: PLR0913
        self,
        server_name: str,
        config: ServerParameters,
        host: str,
        port: int,
        server_type: ServerType,
        actor_charge_function: Callable[[str, int], Awaitable[Any]] | None = None,
        tool_whitelist: dict[str, tuple[str, int]] | None = None,
        session_timeout_secs: int = SESSION_TIMEOUT_SECS,
    ) -> None:
        """Initialize the proxy server.

        Args:
            server_name: Name of the server (used in HTML page)
            config: Server configuration (stdio or SSE parameters)
            host: Host to bind the server to
            port: Port to bind the server to
            server_type: Type of server to connect (stdio, SSE, or HTTP)
            actor_charge_function: Optional function to charge for operations.
                           Should accept (event_name: str, count: int).
                           Typically, Actor.charge in Apify Actors.
                           If None, no charging will occur.
            tool_whitelist: Optional dict mapping tool names to (event_name, default_count) tuples.
                           If provided, only whitelisted tools will be allowed and charged.
                           If None, all tools are allowed without specific charging.
            session_timeout_secs: Inactivity timeout in seconds before terminating idle sessions
        """
        self.server_name = server_name
        self.server_type = server_type
        self.config = self._validate_config(self.server_type, config)
        self.host: str = host
        self.port: int = port
        self.actor_charge_function = actor_charge_function
        self.tool_whitelist = tool_whitelist
        # Track per-session activity and timers for inactivity shutdown
        self._session_last_activity: dict[str, float] = {}
        self._session_timers: dict[str, asyncio.Task] = {}
        # Inactivity window (seconds) before we terminate a session (DELETE)
        self._session_timeout_secs: int = session_timeout_secs

    @staticmethod
    def _log_request(request: Request) -> None:
        """Log incoming MCP transport request for diagnostics."""
        logger.info(
            'MCP transport request',
            extra={
                'method': request.method,
                'path': str(request.url.path),
                'mcp_session_id': request.headers.get('mcp-session-id'),
            },
        )

    def _touch_session(self, session_id: str, session_manager: StreamableHTTPSessionManager) -> None:
        """Record activity for a session and (re)schedule inactivity termination."""
        self._session_last_activity[session_id] = time.time()

        # Cancel existing timer if present
        timer = self._session_timers.get(session_id)
        if timer and not timer.done():
            timer.cancel()

        async def _idle_close() -> None:
            try:
                await asyncio.sleep(self._session_timeout_secs)
                # Verify that no new activity occurred during wait
                last = self._session_last_activity.get(session_id, 0)
                if time.time() - last < self._session_timeout_secs * 0.9:
                    return  # Activity happened; skip
                logger.info(f'Terminating idle MCP session {session_id}')

                # Craft an internal ASGI DELETE request to close the session
                scope = {
                    'type': 'http',
                    'http_version': '1.1',
                    'method': 'DELETE',
                    'scheme': 'http',
                    'path': '/mcp/',
                    'raw_path': b'/mcp/',
                    'query_string': b'',
                    'headers': [
                        (b'mcp-session-id', session_id.encode('utf-8')),
                        (b'accept', b'application/json, text/event-stream'),
                    ],
                    'server': (self.host, self.port),
                    'client': ('127.0.0.1', 0),
                }

                async def _receive() -> dict[str, Any]:
                    return {'type': 'http.request', 'body': b'', 'more_body': False}

                async def _send(_message: dict[str, Any]) -> None:
                    # Ignore internal response
                    return

                await session_manager.handle_request(scope, _receive, _send)  # type: ignore[arg-type]
                self._cleanup_session_last_activity(session_id)
                self._cleanup_session_timer(session_id)
            except asyncio.CancelledError:
                return
            except Exception:
                logger.exception('Failed to terminate idle session')

        self._session_timers[session_id] = asyncio.create_task(_idle_close())

    def _cleanup_session_last_activity(self, session_id: str) -> None:
        """Cleanup session tracking data."""
        if session_id in self._session_last_activity:
            del self._session_last_activity[session_id]

    def _cleanup_session_timer(self, session_id: str) -> None:
        """Cancel and cleanup session timer."""
        if session_id in self._session_timers:
            timer = self._session_timers[session_id]
            if not timer.done():
                timer.cancel()
            del self._session_timers[session_id]

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
    def _create_capturing_send(
        send: Send, session_id_from_resp: dict[str, str | None]
    ) -> Callable[[dict[str, Any]], Awaitable[None]]:
        """Create a send wrapper that captures session ID from response headers."""

        async def capturing_send(message: dict[str, Any]) -> None:
            if message.get('type') == 'http.response.start':
                headers = {k.decode('latin-1').lower(): v.decode('latin-1') for k, v in message.get('headers', [])}
                if sid := headers.get('mcp-session-id'):
                    session_id_from_resp['sid'] = sid
            await send(message)

        return capturing_send

    async def create_starlette_app(self, mcp_server: Server) -> Starlette:
        """Create a Starlette app that exposes /mcp endpoint for Streamable HTTP transport."""
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

            # Browser client logic - Check if the request is from a HTML browser
            if is_html_browser(request):
                server_url = f'https://{request.headers.get("host", "localhost")}'
                mcp_url = f'{server_url}/mcp'
                return serve_html_page(self.server_name, mcp_url)

            return JSONResponse(
                {
                    'status': 'running',
                    'type': 'mcp-server',
                    'transport': 'streamable-http',
                    'endpoints': {
                        'streamableHttp': '/mcp',
                    },
                }
            )

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
            # Check if this is a GET request from a browser
            request = Request(scope, receive)
            self._log_request(request)
            if scope['method'] == 'GET' and is_html_browser(request):
                server_url = f'https://{request.headers.get("host", "localhost")}'
                mcp_url = f'{server_url}/mcp'
                response = serve_html_page(self.server_name, mcp_url)
                # Send the HTML response
                await response(scope, receive, send)
                return

            if scope['method'] == 'DELETE':
                await session_manager.handle_request(scope, receive, send)
                if req_sid := request.headers.get('mcp-session-id'):
                    self._cleanup_session_last_activity(req_sid)
                    self._cleanup_session_timer(req_sid)
                return

            # For non-browser requests or non-GET requests, delegate to session manager
            # Wrap `send` to capture the session ID from response headers of initialization
            session_id_from_resp: dict[str, str | None] = {'sid': None}
            capturing_send = self._create_capturing_send(send, session_id_from_resp)

            # Log and touch existing session if present on request
            if req_sid := request.headers.get('mcp-session-id'):
                self._touch_session(req_sid, session_manager)

            await session_manager.handle_request(scope, receive, capturing_send)  # type: ignore[arg-type]

            # If this was an initialization (no session id in request), capture from response and touch
            if not req_sid and session_id_from_resp['sid']:
                self._touch_session(session_id_from_resp['sid'], session_manager)

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

        if self.server_type == ServerType.STDIO:
            # validate config again to prevent mypy errors
            config_ = StdioServerParameters.model_validate(self.config)
            async with (
                stdio_client(config_) as (read_stream, write_stream),
                ClientSession(read_stream, write_stream) as session,
            ):
                mcp_server = await create_gateway(session, self.actor_charge_function, self.tool_whitelist)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)

        elif self.server_type == ServerType.SSE:
            async with (
                sse_client(**params) as (read_stream, write_stream),
                ClientSession(read_stream, write_stream) as session,
            ):
                mcp_server = await create_gateway(session, self.actor_charge_function, self.tool_whitelist)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)

        elif self.server_type == ServerType.HTTP:
            # HTTP streamable server needs to unpack three parameters
            async with (
                streamablehttp_client(**params) as (read_stream, write_stream, _),
                ClientSession(read_stream, write_stream) as session,
            ):
                mcp_server = await create_gateway(session, self.actor_charge_function, self.tool_whitelist)
                app = await self.create_starlette_app(mcp_server)
                await self._run_server(app)
        else:
            raise ValueError(f'Unknown server type: {self.server_type}')
