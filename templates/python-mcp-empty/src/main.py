"""Main entry point for the MCP Server Actor."""

import asyncio
import os
import time
from collections.abc import Mapping, MutableMapping
from typing import Any

import uvicorn
from apify import Actor
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.types import Receive, Scope, Send


def get_server() -> FastMCP:
    """Create an MCP server with tools and resources."""
    server = FastMCP('python-mcp-empty', '1.0.0')

    @server.tool()  # type: ignore[misc]
    def add(a: float, b: float) -> dict:
        """Add two numbers together and return the sum."""
        result = a + b
        return {
            'type': 'text',
            'text': f'The sum of {a} and {b} is {result}',
            'structuredContent': {
                'result': result,
                'operands': {'a': a, 'b': b},
                'operation': 'addition',
            },
        }

    @server.resource(uri='https://example.com/calculator', name='calculator-info')  # type: ignore[misc]
    def calculator_info() -> str:
        """Get information about the calculator service."""
        return 'This is a simple calculator MCP server that can add two numbers together.'

    return server


def get_session_id(headers: Mapping[str, str]) -> str | None:
    """Extract session ID from request headers."""
    for key in ('mcp-session-id', 'mcp_session_id'):
        if value := headers.get(key):
            return value
    return None


class SessionTrackingMiddleware:
    """ASGI middleware that tracks MCP sessions and closes idle ones."""

    def __init__(self, app: Any, port: int, timeout_secs: int) -> None:
        self.app = app
        self.port = port
        self.timeout_secs = timeout_secs

        # Session tracking state
        self._last_activity: dict[str, float] = {}
        self._timers: dict[str, asyncio.Task[None]] = {}

    def _session_cleanup(self, sid: str) -> None:
        self._last_activity.pop(sid, None)
        if (timer := self._timers.pop(sid, None)) and not timer.done():
            timer.cancel()

    def _touch(self, sid: str) -> None:
        self._last_activity[sid] = time.time()

        # Cancel existing timer
        if (timer := self._timers.get(sid)) and not timer.done():
            timer.cancel()

        async def close_if_idle() -> None:
            try:
                await asyncio.sleep(self.timeout_secs)

                # Check if activity occurred during sleep
                elapsed = time.time() - self._last_activity.get(sid, 0)
                if elapsed < self.timeout_secs * 0.9:
                    return

                Actor.log.info(f'Closing idle session: {sid}')

                # Send internal DELETE request to close session
                scope: Scope = {
                    'type': 'http',
                    'http_version': '1.1',
                    'method': 'DELETE',
                    'scheme': 'http',
                    'path': '/mcp',
                    'raw_path': b'/mcp',
                    'query_string': b'',
                    'headers': [(b'mcp-session-id', sid.encode())],
                    'server': ('127.0.0.1', self.port),
                    'client': ('127.0.0.1', 0),
                    '_idle_close': True,
                }

                async def noop_receive() -> MutableMapping[str, Any]:
                    return {'type': 'http.request', 'body': b'', 'more_body': False}

                async def noop_send(_: MutableMapping[str, Any]) -> None:
                    pass

                # Re-enter middleware with an internal DELETE; _idle_close will skip tracking
                await self(scope, noop_receive, noop_send)
                self._session_cleanup(sid)

            except asyncio.CancelledError:
                pass
            except Exception as e:
                Actor.log.exception(f'Failed to close idle session {sid}: {e}')

        self._timers[sid] = asyncio.create_task(close_if_idle())

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """ASGI entry point that wraps the underlying app."""
        # Pass through non-MCP requests
        path = scope.get('path', '')
        if scope.get('type') != 'http' or path not in ('/mcp', '/mcp/'):
            await self.app(scope, receive, send)
            return

        # Skip tracking for internal idle-close requests
        if scope.get('_idle_close'):
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        sid = get_session_id(request.headers)
        is_delete = scope.get('method') == 'DELETE'

        # Track activity for existing sessions (skip DELETE)
        if sid and not is_delete:
            self._touch(sid)

        # Capture new session ID from response headers
        new_sid: str | None = None

        async def capture_send(msg: MutableMapping[str, Any]) -> None:
            nonlocal new_sid
            if msg.get('type') == 'http.response.start':
                for k, v in msg.get('headers', []):
                    if k.decode().lower() == 'mcp-session-id':
                        new_sid = v.decode()
                        break
            await send(msg)

        await self.app(scope, receive, capture_send)

        # Track a newly created session
        if not sid and new_sid:
            Actor.log.info(f'New session: {new_sid}')
            self._touch(new_sid)

        # Cleanup on explicit DELETE
        if is_delete and sid:
            Actor.log.info(f'Session closed: {sid}')
            self._session_cleanup(sid)


async def main() -> None:
    """Run the MCP Server Actor with session timeout handling."""
    await Actor.init()

    port = int(os.environ.get('APIFY_CONTAINER_PORT', '3000'))
    timeout_secs = int(os.environ.get('SESSION_TIMEOUT_SECS', '300'))

    server = get_server()
    app = server.http_app(transport='streamable-http')

    # Wrap the app with session tracking middleware to handle idle timeouts
    app = SessionTrackingMiddleware(app=app, port=port, timeout_secs=timeout_secs)

    try:
        Actor.log.info(f'Starting MCP server on port {port} (session timeout: {timeout_secs}s)')
        config = uvicorn.Config(app, host='0.0.0.0', port=port, log_level='info')  # noqa: S104
        await uvicorn.Server(config).serve()
    except KeyboardInterrupt:
        Actor.log.info('Shutting down...')
    except Exception as e:
        Actor.log.error(f'Server failed: {e}')
        raise


if __name__ == '__main__':
    asyncio.run(main())
