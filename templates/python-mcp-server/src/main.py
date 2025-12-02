"""Main entry point for the MCP Server Actor."""

import os
from contextlib import asynccontextmanager

from fastmcp import FastMCP
from apify import Actor


# Initialize the Apify Actor environment
# This call configures the Actor for its environment and should be called at startup


def get_server() -> FastMCP:
    """Create an MCP server with implementation details."""
    server = FastMCP('add-tool-mcp-server', '1.0.0')

    @server.tool()
    def add(a: float, b: float) -> dict:
        """Adds two numbers together and returns the sum with structured output.

        Args:
            a: First number to add
            b: Second number to add

        Returns:
            Dictionary with the sum result and structured output
        """
        # Note: We can't await here in sync context, so charging happens in async wrapper
        sum_result = a + b
        structured_content = {
            'result': sum_result,
            'operands': {'a': a, 'b': b},
            'operation': 'addition',
        }

        return {
            'type': 'text',
            'text': f'The sum of {a} and {b} is {sum_result}',
            'structuredContent': structured_content,
        }

    @server.resource(uri='https://example.com/calculator', name='calculator-info')
    def calculator_info() -> str:
        """Get information about the calculator service."""
        return 'This is a simple calculator MCP server that can add two numbers together.'

    return server


async def main() -> None:
    """Run the MCP Server Actor.

    This function:
    1. Initializes the Actor
    2. Creates and configures the MCP server
    3. Starts the HTTP server with Streamable HTTP transport
    4. Handles MCP requests
    """
    await Actor.init()

    # Get port from environment or default to 3000
    port = int(os.environ.get('APIFY_CONTAINER_PORT', '3000'))

    server = get_server()

    try:
        Actor.log.info('Starting MCP server with FastMCP')

        # Start the FastMCP server with HTTP transport
        # This starts the server on the specified port and handles MCP protocol messages
        await server.run_http_async(
            host='0.0.0.0',  # noqa: S104 - Required for container networking
            port=port,
        )
    except KeyboardInterrupt:
        Actor.log.info('Shutting down server...')
    except Exception as error:
        Actor.log.error(f'Server failed to start: {error}')
        raise


if __name__ == '__main__':
    import asyncio

    asyncio.run(main())
