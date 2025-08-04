## 🚀 Python MCP Server Template

A Python template for deploying and monetizing a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server in the cloud using the [Apify platform](https://docs.apify.com/platform/actors).

This template enables you to:

- Deploy any Python stdio MCP server (e.g., [ArXiv MCP Server](https://github.com/blazickjp/arxiv-mcp-server)), or connect to an existing remote MCP server using HTTP or SSE transport
- Expose your MCP server via [legacy Server-Sent Events (SSE)](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse) or [streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) transport
- Monetize your server using Apify's Pay Per Event (PPE) model

## ✨ Features

- Support for stdio-based, HTTP-streamable, and SSE-based MCP servers
- Built-in charging: Integrated [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) for:
    - Server startup
    - Tool calls
    - Resource access
    - Prompt operations
    - List operations
- Easy configuration: Simple setup through environment variables and configuration files

## Quick Start

1. Configure your MCP server in `src/main.py`:

    ```python
    # For stdio server:
    server_type = ServerType.STDIO
    MCP_SERVER_PARAMS = StdioServerParameters(
        command='your-command',
        args=['your', 'args'],
    )

    # For HTTP or SSE server:
    # server_type = ServerType.HTTP  # or ServerType.SSE
    # MCP_SERVER_PARAMS = RemoteServerParameters(
    #     url='your-server-url',
    # )
    ```

2. Add any required dependencies to the `requirements.txt` file (e.g. [arxiv-mcp-server](https://github.com/blazickjp/arxiv-mcp-server)).
3. Deploy to Apify and enable standby mode.
4. Connect using an MCP client:
    - Using [streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http):
        ```json
        {
            "mcpServers": {
                "your-server": {
                    "url": "https://your-actor.apify.actor/mcp"
                }
            }
        }
        ```
    - Using [legacy SSE transport](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse):
        ```json
        {
            "mcpServers": {
                "your-server": {
                    "url": "https://your-actor.apify.actor/sse"
                }
            }
        }
        ```

## 💰 Pricing

This template uses the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) monetization model, which provides flexible pricing based on defined events.

To charge users, define events in JSON format and save them on the Apify platform. Here is an example schema:

```json
{
    "actor-start": {
        "eventTitle": "MCP server startup",
        "eventDescription": "Initial fee for starting the Actor MCP Server",
        "eventPriceUsd": 0.1
    },
    "tool-call": {
        "eventTitle": "MCP tool call",
        "eventDescription": "Fee for executing MCP tools",
        "eventPriceUsd": 0.05
    }
}
```

In the Actor, trigger events with:

```python
await Actor.charge('actor-start', 1)  # Charge for server startup
await Actor.charge('tool-call', 1)    # Charge for tool execution
```

To set up the PPE model:

1. Go to your Actor's **Publication settings**.
2. Set the **Pricing model** to `Pay per event`.
3. Add the pricing schema (see [pay_per_event.json](.actor/pay_per_event.json) for a complete example).

## 🔧 How It Works

This template implements a proxy server that can connect to a stdio-based, HTTP-streamable, or SSE-based MCP server and expose it via [legacy Server-Sent Events (SSE) transport](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse) or [streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http). Here's how it works:

### Server types

1. **Stdio Server** (`StdioServerParameters`):
    - Spawns a local process that implements the MCP protocol over stdio.
    - Configure using the `command` parameter to specify the executable and the `args` parameter for additional arguments.
    - Optionally, use the `env` parameter to pass environment variables to the process.

Example:

```python
server_type = ServerType.STDIO
MCP_SERVER_PARAMS = StdioServerParameters(
    command='uv',
    args=['run', 'arxiv-mcp-server'],
    env={'YOUR_ENV_VAR': os.getenv('YOUR-ENV-VAR')},  # Optional environment variables
)
```

2. **Remote Server** (`RemoteServerParameters`):
    - Connects to a remote MCP server via HTTP or SSE transport.
    - Configure using the `url` parameter to specify the server's endpoint.
    - Set the appropriate `server_type` (ServerType.HTTP or ServerType.SSE).
    - Optionally, use the `headers` parameter to include custom headers (e.g., for authentication) and the `auth` parameter for additional authentication mechanisms.

Example for HTTP:

```python
server_type = ServerType.HTTP
MCP_SERVER_PARAMS = RemoteServerParameters(
    url='https://mcp.apify.com',
    headers={'Authorization': 'Bearer YOUR-API-KEY'},  # Replace with your authentication token
)
```

Example for SSE:

```python
server_type = ServerType.SSE
MCP_SERVER_PARAMS = RemoteServerParameters(
    url='https://mcp.apify.com/sse',
    headers={'Authorization': 'Bearer YOUR-API-KEY'},  # Replace with your authentication token
)
```

- **Tips**:
    - Ensure the remote server supports the transport type you're using and is accessible from the Actor's environment.
    - Use environment variables to securely store sensitive information like tokens or API keys.

#### Environment variables:

Environment variables can be securely stored and managed at the Actor level on the [Apify platform](https://docs.apify.com/platform/actors/development/programming-interface/environment-variables#custom-environment-variables). These variables are automatically injected into the Actor's runtime environment, allowing you to:

- Keep sensitive information like API keys secure.
- Simplify configuration by avoiding hardcoded values in your code.

### Proxy implementation

The proxy server (`ProxyServer` class) handles:

- Creating a Starlette web server with legacy SSE (`/sse` and `/messages/`) and streamable HTTP (`/mcp`) endpoints
- Managing connections to the underlying MCP server
- Forwarding requests and responses between clients and the MCP server
- Handling charging through the `actor_charge_function`

Key components:

- `ProxyServer`: Main class that manages the proxy functionality
- `create_proxy_server`: Creates an MCP server instance that proxies requests
- `charge_mcp_operation`: Handles charging for different MCP operations

### MCP operations

The proxy supports all standard MCP operations:

- `list_tools()`: List available tools
- `call_tool()`: Execute a tool with arguments
- `list_prompts()`: List available prompts
- `get_prompt()`: Get a specific prompt
- `list_resources()`: List available resources
- `read_resource()`: Read a specific resource

Each operation can be configured for charging in the PPE model.

## 📚 Resources

- [What is Anthropic's Model Context Protocol?](https://blog.apify.com/what-is-model-context-protocol/)
- [How to use MCP with Apify Actors](https://blog.apify.com/how-to-use-mcp/)
- [Apify MCP server](https://mcp.apify.com)
- [Apify MCP server documentation](https://docs.apify.com/platform/integrations/mcp)
- [Apify MCP client](https://apify.com/jiri.spilka/tester-mcp-client)
- [Model Context Protocol documentation](https://modelcontextprotocol.io)
- [TypeScript tutorials in Academy](https://docs.apify.com/academy/node-js)
- [Apify SDK documentation](https://docs.apify.com/sdk/js/)
