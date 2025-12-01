from enum import Enum
from typing import Any, TypeAlias

import httpx
from mcp.client.stdio import StdioServerParameters
from pydantic import BaseModel, ConfigDict


class ServerType(str, Enum):
    """Type of server to connect."""

    STDIO = 'stdio'  # Connect to a stdio server
    SSE = 'sse'  # Connect to an SSE server
    HTTP = 'http'  # Connect to an HTTP server (Streamable HTTP)


class RemoteServerParameters(BaseModel):
    """Parameters for connecting to a Streamable HTTP or SSE-based MCP server.

    These parameters are passed either to the `streamable http_client` or `sse_client` from MCP SDK.

    Attributes:
        url: The URL of the HTTP or SSE server endpoint
        headers: Optional HTTP headers to include in the connection request
    """

    url: str
    headers: dict[str, Any] | None = None
    timeout: float = 60  # HTTP timeout for regular operations
    sse_read_timeout: float = 60 * 5  # Timeout for SSE read operations
    auth: httpx.Auth | None = None  # Optional HTTPX authentication handler
    model_config = ConfigDict(arbitrary_types_allowed=True)


# Type alias for server parameters
ServerParameters: TypeAlias = StdioServerParameters | RemoteServerParameters
