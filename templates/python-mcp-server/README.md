## 🚀 Python MCP Server Template
<!-- This is an Apify template readme -->

A Python template for deploying and monetizing a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server in the cloud using the [Apify platform](https://docs.apify.com/platform/actors).

This template enables you to:

- Deploy any Python stdio MCP server (e.g., [ArXiv MCP Server](https://github.com/blazickjp/arxiv-mcp-server)), or connect to an existing remote MCP server using Streamable HTTP or SSE transport
- Expose your MCP server via [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) transport
- Monetize your server using Apify's Pay Per Event (PPE) model

## ✨ Features

- Support for **stdio-based, Streamable HTTP**, and SSE-based MCP servers
- **Built-in charging**: Integrated [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) for:
    - Server startup
    - Tool calls
    - Resource access
    - Prompt operations
    - List operations
- **Gateway**: Acts as a controlled entry point to MCP servers with charging and authorization logic

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
    - Using [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http):
        ```json
        {
            "mcpServers": {
                "your-server": {
                    "url": "https://your-actor.apify.actor/mcp"
                }
            }
        }
        ```
    - Note: SSE endpoint serving has been deprecated, but SSE client connections are still supported.

## 💰 Pricing

This template uses the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) monetization model, which provides flexible pricing based on defined events.

### Charging strategy options

The template supports multiple charging approaches that you can customize based on your needs:

#### 1. Generic MCP charging
Charge for standard MCP operations with flat rates:

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
    },
    "resource-read": {
        "eventTitle": "MCP resource access",
        "eventDescription": "Fee for accessing full content or resources",
        "eventPriceUsd": 0.0001
    },
    "prompt-get": {
        "eventTitle": "MCP prompt processing",
        "eventDescription": "Fee for processing AI prompts",
        "eventPriceUsd": 0.0001
    }
}
```

#### 2. Domain-specific charging (arXiv example)
Charge different amounts for different tools based on computational cost:

```json
{
    "actor-start": {
        "eventTitle": "arXiv MCP server startup",
        "eventDescription": "Initial fee for starting the arXiv MCP Server Actor",
        "eventPriceUsd": 0.1
    },
    "search_papers": {
        "eventTitle": "arXiv paper search",
        "eventDescription": "Fee for searching papers on arXiv",
        "eventPriceUsd": 0.001
    },
    "list_papers": {
        "eventTitle": "arXiv paper listing",
        "eventDescription": "Fee for listing available papers",
        "eventPriceUsd": 0.001
    },
    "download_paper": {
        "eventTitle": "arXiv paper download",
        "eventDescription": "Fee for downloading a paper from arXiv",
        "eventPriceUsd": 0.001
    },
    "read_paper": {
        "eventTitle": "arXiv paper reading",
        "eventDescription": "Fee for reading the full content of a paper",
        "eventPriceUsd": 0.01
    }
}
```

#### 3. No charging (free service)
Comment out all charging lines in the code for a free service.

### How to implement charging

1. **Define your events** in `.actor/pay_per_event.json` (see examples above). This file is not actually used at Apify platform but serves as a reference.

2. **Enable charging in code** by uncommenting the appropriate lines in `src/mcp_gateway.py`:

   ```python
   # For generic charging:
   await charge_mcp_operation(actor_charge_function, ChargeEvents.TOOL_CALL)

   # For domain-specific charging:
   if tool_name == 'search_papers':
       await charge_mcp_operation(actor_charge_function, ChargeEvents.SEARCH_PAPERS)
   ```

3. **Add custom events** to `src/const.py` if needed:

   ```python
   class ChargeEvents(str, Enum):
       # Your custom events
       CUSTOM_OPERATION = 'custom-operation'
   ```

4. **Set up PPE model** on Apify:
   - Go to your Actor's **Publication settings**
   - Set the **Pricing model** to `Pay per event`
   - Add your pricing schema from `pay_per_event.json`

### Authorized tools

This template includes **tool authorization** - only tools listed in `src/const.py` can be executed:

**Note**: The `TOOL_WHITELIST` dictionary only applies to **tools** (executable functions).
Prompts (like `deep-paper-analysis`) are handled separately and don't need to be added to this list.

Tool whitelist for MCP server
Only tools listed here will be present to the user and allowed to execute.
Format of the dictionary: {tool_name: (charge_event_name, default_count)}
To add new authorized tools, add an entry with the tool name and its charging configuration.

```python
TOOL_WHITELIST = {
    ChargeEvents.SEARCH_PAPERS.value: (ChargeEvents.SEARCH_PAPERS.value, 1),
    ChargeEvents.LIST_PAPERS.value: (ChargeEvents.LIST_PAPERS.value, 1),
    ChargeEvents.DOWNLOAD_PAPER.value: (ChargeEvents.DOWNLOAD_PAPER.value, 1),
    ChargeEvents.READ_PAPER.value: (ChargeEvents.READ_PAPER.value, 1),
}
```

**To add new tools:**
1. Add charge event to `ChargeEvents` enum
2. Add tool entry to `TOOL_WHITELIST` dictionary with format: `tool_name: (event_name, count)`
3. Update pricing in `pay_per_event.json`
4. Update pricing at Apify platform

Unauthorized tools are blocked with clear error messages.

## 🔧 How it works

This template implements a MCP gateway that can connect to a stdio-based, Streamable HTTP, or SSE-based MCP server and expose it via [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http). Here's how it works:

### Server types

1. **Stdio server** (`StdioServerParameters`):
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

2. **Remote server** (`RemoteServerParameters`):
    - Connects to a remote MCP server via HTTP or SSE transport.
    - Configure using the `url` parameter to specify the server's endpoint.
    - Set the appropriate `server_type` (ServerType.HTTP or ServerType.SSE).
    - Optionally, use the `headers` parameter to include custom headers (e.g., for authentication) and the `auth` parameter for additional authentication mechanisms.

Example:

```python
server_type = ServerType.HTTP
MCP_SERVER_PARAMS = RemoteServerParameters(
    url='https://mcp.apify.com',
    headers={'Authorization': 'Bearer YOUR-API-KEY'},  # Replace with your authentication token
)
```

Note: SSE transport is also supported by setting `server_type = ServerType.SSE`.

- **Tips**:
    - Ensure the remote server supports the transport type you're using and is accessible from the Actor's environment.
    - Use environment variables to securely store sensitive information like tokens or API keys.

#### Environment variables:

Environment variables can be securely stored and managed at the Actor level on the [Apify platform](https://docs.apify.com/platform/actors/development/programming-interface/environment-variables#custom-environment-variables). These variables are automatically injected into the Actor's runtime environment, allowing you to:

- Keep sensitive information like API keys secure.
- Simplify configuration by avoiding hardcoded values in your code.

### Gateway implementation

The MCP gateway (`create_gateway` function) handles:

- Creating a Starlette web server with Streamable HTTP (`/mcp`) endpoint
- Managing connections to the underlying MCP server
- Forwarding requests and responses between clients and the MCP server
- Handling charging through the `actor_charge_function` (`Actor.charge` in Apify Actors)
- Tool authorization: Only allowing whitelisted tools to execute
- Access control: Blocking unauthorized tool calls with clear error messages

Key components:

- `create_gateway`: Creates an MCP server instance that acts as a gateway
- `charge_mcp_operation`: Handles charging for different MCP operations
- `TOOL_WHITELIST`: Dictionary mapping tool names to (event_name, count) tuples for authorization and charging

### MCP operations

The MCP gateway supports all standard MCP operations:

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
- [MCP Servers hosted at Apify](https://apify.com/store/categories/mcp-servers)
- [Model Context Protocol documentation](https://modelcontextprotocol.io)
- [Apify SDK documentation](https://docs.apify.com/sdk/js/)
