## MCP server template

A template for running and monetizing a [Model Context Protocol](https://modelcontextprotocol.io) server using [stdio](https://modelcontextprotocol.io/docs/concepts/transports#standard-input%2Foutput-stdio) transport on [Apify platform](https://docs.apify.com/platform).
This allows you to run any stdio MCP server as a [standby Actor](https://docs.apify.com/platform/actors/development/programming-interface/standby) and connect via either the [streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) or the legacy [SSE transport](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse) with an [MCP client](https://modelcontextprotocol.io/clients).

## How to use

Change the `MCP_COMMAND` to spawn your stdio MCP server in `src/main.ts`, and don't forget to install the required MCP server in the `package.json` (using `npm install ...`).
By default, this template runs an [Everything MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/everything) using the following command:

```
npx @modelcontextprotocol/server-everything
```

Feel free to configure billing logic in `.actor/pay_per_event.json` and `src/billing.ts`.

[Push your Actor](https://docs.apify.com/academy/deploying-your-code/deploying) to the Apify platform, configure [standby mode](https://docs.apify.com/platform/actors/development/programming-interface/standby), and then connect to the Actor standby URL with your MCP client. You can use either:

- `https://me--my-mcp-server.apify.actor/mcp` ([streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http), recommended)
- `https://me--my-mcp-server.apify.actor/sse` ([legacy SSE transport](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse))

### Pay per event

This template uses the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) monetization model, which provides flexible pricing based on defined events.

To charge users, define events in JSON format and save them on the Apify platform. Here is an example schema with the `tool-request` event:

```json
[
    {
        "tool-request": {
            "eventTitle": "Price for completing a tool request",
            "eventDescription": "Flat fee for completing a tool request.",
            "eventPriceUsd": 0.05
        }
    }
]
```

In the Actor, trigger the event with:

```typescript
await Actor.charge({ eventName: 'tool-request' });
```

This approach allows you to programmatically charge users directly from your Actor, covering the costs of execution and related services.

To set up the PPE model for this Actor:

- **Configure Pay Per Event**: establish the Pay Per Event pricing schema in the Actor's **Monetization settings**. First, set the **Pricing model** to `Pay per event` and add the schema. An example schema can be found in [pay_per_event.json](.actor/pay_per_event.json).

## Resources

- [What is Anthropic's Model Context Protocol?](https://blog.apify.com/what-is-model-context-protocol/)
- [How to use MCP with Apify Actors](https://blog.apify.com/how-to-use-mcp/)
- [Apify MCP server](https://mcp.apify.com)
- [Apify MCP server documentation](https://docs.apify.com/platform/integrations/mcp)
- [Apify MCP client](https://apify.com/jiri.spilka/tester-mcp-client)
- [Model Context Protocol documentation](https://modelcontextprotocol.io)
- [TypeScript tutorials in Academy](https://docs.apify.com/academy/node-js)
- [Apify SDK documentation](https://docs.apify.com/sdk/js/)
