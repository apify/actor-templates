from enum import Enum
from typing import Any, TypeAlias

import httpx
from mcp.client.stdio import StdioServerParameters
from pydantic import BaseModel, ConfigDict


class ServerType(str, Enum):
    """Type of server to connect."""

    STDIO = 'stdio'  # Connect to a stdio server
    SSE = 'sse'  # Connect to an SSE server


class SseServerParameters(BaseModel):
    """Parameters for connecting to an SSE-based MCP server.

    Attributes:
        url: The URL of the SSE server endpoint
        headers: Optional HTTP headers to include in the connection request
    """

    url: str
    headers: dict[str, Any] | None = None
    timeout: float = 5  # Default timeout for SSE connection
    sse_read_timeout: float = 60 * 5  # Default read timeout for SSE connection
    auth: httpx.Auth | None = None
    model_config = ConfigDict(arbitrary_types_allowed=True)


# Type alias for server parameters
ServerParameters: TypeAlias = StdioServerParameters | SseServerParameters
