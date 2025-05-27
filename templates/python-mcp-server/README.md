## 🚀 Python MCP Server Template

A Python template for deploying and monetizing a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server in the cloud using the [Apify platform](https://docs.apify.com/platform/actors).

This template enables you to:
- Deploy any Python stdio MCP server (like [ArXiv MCP Server](https://github.com/blazickjp/arxiv-mcp-server)) to Apify
- Connect to any remote MCP server via SSE transport
- Expose your MCP server via Server-Sent Events (SSE) transport
- Monetize your server using Apify's Pay Per Event (PPE) model

## ✨ Features

- Support for both stdio-based and SSE-based MCP servers
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
   MCP_SERVER_PARAMS = StdioServerParameters(
       command='your-command',
       args=['your', 'args'],
   )

   # For SSE server:
   MCP_SERVER_PARAMS = SseServerParameters(
       url='your-server-url',
   )
   ```

2. Deploy to Apify and enable standby mode
3. Connect using an MCP client:
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
await Actor.charge('actor-start')  # Charge for server startup
await Actor.charge('tool-call')    # Charge for tool execution
```

To set up the PPE model:
1. Go to your Actor's **Monetization settings**
2. Set the **Pricing model** to `Pay per event`
3. Add the pricing schema (see [pay_per_event.json](.actor/pay_per_event.json) for a complete example)

## 🔧 How It Works

This template implements a proxy server that can connect to either a stdio-based or SSE-based MCP server and expose it via SSE transport. Here's how it works:

### Server types

1. **Stdio Server** (`StdioServerParameters`):
   - Spawns a local process that implements the MCP protocol over stdio
   - Configure using `command` and `args` parameters
   - Example: Running a Python script that implements MCP server

2. **SSE Server** (`SseServerParameters`):
   - Connects to a remote MCP server via SSE transport
   - Configure using `url` and optional `headers`/`auth`
   - Example: Connecting to an existing remote MCP server

### Proxy implementation

The proxy server (`ProxyServer` class) handles:
- Creating a Starlette web server with SSE endpoints (`/sse` and `/messages/`)
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

