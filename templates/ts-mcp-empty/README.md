## MCP server template

<!-- This is an Apify template readme -->

A template for creating a [Model Context Protocol](https://modelcontextprotocol.io) server using [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) on [Apify platform](https://docs.apify.com/platform).

This template includes a simple example MCP server with:

- An `add` tool that adds two numbers together with structured output
- A dummy `calculator-info` resource endpoint
- Pay [Per Event monetization](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) support

## How to use

1. **Modify the server**: Edit `src/main.ts` to add your own tools and resources
2. **Add new tools**: Use the `server.registerTool()` method to register new tools
3. **Add new resources**: Use the `server.registerResource()` method to register new resources
4. **Update billing**: Configure billing events in `.actor/pay_per_event.json` and charge for tool calls

The server runs on port 3000 (or APIFY_CONTAINER_PORT if set) and exposes the MCP protocol at the `/mcp` endpoint.

## Running locally

```bash
npm install
npm run start:dev
```

The server will start and listen for MCP requests at `http://localhost:3000/mcp`

## Deploying to Apify

[Push your Actor](https://docs.apify.com/academy/deploying-your-code/deploying) to the Apify platform and configure [standby mode](https://docs.apify.com/platform/actors/development/programming-interface/standby).

Then connect to the Actor endpoint with your MCP client: `https://me--my-mcp-server.apify.actor/mcp` using the [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http).

**Important:** When connecting to your deployed MCP server, pass your Apify API token in the `Authorization` header as a Bearer token:

```
Authorization: Bearer <YOUR_APIFY_API_TOKEN>
```

### Pay per event

This template uses the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) monetization model, which provides flexible pricing based on defined events.

To charge users, define events in JSON format and save them on the Apify platform. Here is an example schema with the `tool-call` event:

```json
[
    {
        "tool-call": {
            "eventTitle": "Price for completing a tool call",
            "eventDescription": "Flat fee for completing a tool call.",
            "eventPriceUsd": 0.05
        }
    }
]
```

In the Actor, trigger the event with:

```typescript
await Actor.charge({ eventName: 'tool-call' });
```

This approach allows you to programmatically charge users directly from your Actor, covering the costs of execution and related services.

To set up the PPE model for this Actor:

- **Configure Pay Per Event**: establish the Pay Per Event pricing schema in the Actor's **Monetization settings**. First, set the **Pricing model** to `Pay per event` and add the schema. An example schema can be found in [pay_per_event.json](.actor/pay_per_event.json).

## Resources

- [What is Anthropic's Model Context Protocol?](https://blog.apify.com/what-is-model-context-protocol/)
- [How to use MCP with Apify Actors](https://blog.apify.com/how-to-use-mcp/)
- [TypeScript MCP SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main)
- [TypeScript tutorials in Academy](https://docs.apify.com/academy/node-js)
- [Apify SDK documentation](https://docs.apify.com/sdk/js/)
- [Webinar: Building and monetizing MCP servers on Apify](https://www.youtube.com/watch?v=w3AH3jIrXXo)
- [Apify MCP server documentation](https://docs.apify.com/platform/integrations/mcp)
- [Apify MCP server configuration](https://mcp.apify.com/)
