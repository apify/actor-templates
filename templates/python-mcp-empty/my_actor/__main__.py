"""Main entry point for the MCP Server Actor."""

import asyncio

from .main import main

# Execute the Actor entry point.
asyncio.run(main())
