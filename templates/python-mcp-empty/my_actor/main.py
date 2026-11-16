"""Main entry point for the MCP Server Actor."""

import os

import uvicorn
from apify import Actor
from fastmcp import FastMCP


def get_server() -> FastMCP:
    """Create an MCP server with tools and resources."""
    server = FastMCP('python-mcp-empty', '1.0.0')

    @server.tool()
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

    @server.resource(uri='https://example.com/calculator', name='calculator-info')
    def calculator_info() -> str:
        """Get information about the calculator service."""
        return 'This is a simple calculator MCP server that can add two numbers together.'

    return server


async def main() -> None:
    """Run the MCP Server Actor."""
    await Actor.init()

    port = int(os.environ.get('APIFY_CONTAINER_PORT', '3000'))

    server = get_server()

    # Stateless mode: each request gets a fresh transport and nothing is kept in memory between requests.
    # The platform starts more runs under load and sends each request to any of them, so a session kept
    # in the memory of one run would be missing in the others, and the client would get "Session not found".
    app = server.http_app(transport='streamable-http', stateless_http=True)

    try:
        Actor.log.info(f'Starting MCP server on port {port}')
        config = uvicorn.Config(app, host='0.0.0.0', port=port, log_level='info')  # noqa: S104
        await uvicorn.Server(config).serve()
    except KeyboardInterrupt:
        Actor.log.info('Shutting down...')
    except Exception as e:
        Actor.log.error(f'Server failed: {e}')
        raise
