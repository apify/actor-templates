from enum import Enum
from typing import Any, TypeAlias

import httpx
from mcp.client.stdio import StdioServerParameters
from pydantic import BaseModel, ConfigDict


class ClientType(str, Enum):
    """Type of client connection."""

    STDIO = 'stdio'  # Connect to a stdio server
    SSE = 'sse'  # Connect to an SSE server


class SseServerParameters(BaseModel):
    url: str
    headers: dict[str, Any] | None = None
    timeout: float = 5  # Default timeout for SSE connection
    sse_read_timeout: float = 60 * 5  # Default read timeout for SSE connection
    auth: httpx.Auth | None = None
    model_config = ConfigDict(arbitrary_types_allowed=True)


# Type alias for server parameters
ServerParameters: TypeAlias = StdioServerParameters | SseServerParameters
