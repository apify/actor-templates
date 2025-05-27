import asyncio
import logging
import uvicorn

from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.server import Server
from mcp.server.stdio import stdio_server

from proxy_server import create_proxy_server

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configuration for the remote MCP server
config = {
    "args": ['tool', 'run', 'arxiv-mcp-server'],
    "env": {
        "MCP_SERVER_NAME": "arxiv-mcp-server",
        "MCP_SERVER_DESCRIPTION": "Arxiv MCP Server",
        "MCP_SERVER_VERSION": "1.0.0",
    },
}

server_params = StdioServerParameters(
    command='uv',
    args=config.get("args"),
    env=config.get("env"),
)

async def create_starlette_app(app: Server) -> 'Starlette':
    """Create a Starlette app that serves the MCP server over SSE."""
    from mcp.server.sse import SseServerTransport
    from starlette.applications import Starlette
    from starlette.responses import Response
    from starlette.routing import Mount, Route

    sse = SseServerTransport("/messages/")

    async def handle_sse(request):
        async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
            # Log server info and capabilities before running
            logger.info(f"Starting server with name: {app.name}, version: {app.version}")
            # Pass initialization options when running the server
            init_options = app.create_initialization_options()
            logger.info(f"Initialization options: {init_options}")

            await app.run(streams[0], streams[1], init_options)
        return Response()

    starlette_app = Starlette(
        debug=True,
        routes=[
            Route("/sse", endpoint=handle_sse, methods=["GET"]),
            Mount("/messages/", app=sse.handle_post_message),
        ],
    )
    return starlette_app

async def run_server(app: 'Starlette') -> None:
    """Run the Starlette app with uvicorn."""
    config_ = uvicorn.Config(app, host="localhost", port=3001)
    server = uvicorn.Server(config_)
    await server.serve()

async def run_stdio_server():
    """Run the proxy as a stdio server."""
    logger.info("Starting MCP proxy server with stdio transport")
    async with stdio_client(server_params) as streams, ClientSession(*streams) as session:
        server = await create_proxy_server(session)
        async with stdio_server() as (server_read, server_write):
            logger.info("Proxy server created, running...")
            init_options = server.create_initialization_options()
            await server.run(server_read, server_write, init_options)

async def run_http_server():
    """Run the proxy as an HTTP/SSE server."""
    logger.info("Starting MCP proxy server with HTTP/SSE transport")
    async with stdio_client(server_params) as streams, ClientSession(*streams) as session:
        logger.info("Connected to remote MCP server")
        server = await create_proxy_server(session)
        logger.info("Proxy server created, setting up HTTP transport")
        starlette_app = await create_starlette_app(server)
        logger.info("Starting HTTP server on port 3001")
        await run_server(starlette_app)


if __name__ == '__main__':
    # Choose which server mode to run
    # asyncio.run(run_stdio_server())
    asyncio.run(run_http_server())
