## Python MCP server template

A python template for running and monetizing a [Model Context Protocol](https://modelcontextprotocol.io) server in the cloud.

This template allows to take any Python stdio MCP server and run it on the [Apify platform](https://docs.apify.com/platform/actors).
The Python MCP server is run over stdio transport, which is exposed via [Server-Sent Events (SSE) transport](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse).
This allows you to run any Python stdio MCP server remotely as a [standby Actor](https://docs.apify.com/platform/actors/development/programming-interface/standby) and connect via [SSE transport](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse) with an [MCP client](https://modelcontextprotocol.io/clients).


This template allows to:
- Take any existing python MCP server that uses stdio such as [ArXiv MCP Server](https://github.com/blazickjp/arxiv-mcp-server)
- Deploy it to the Apify platform
- Connect to it via using an [MCP client](https://modelcontextprotocol.io/clients)

## How to use


Change the `MCP_COMMAND` to spawn your stdio MCP server in `src/main.ts`, and don't forget to install the required MCP server in the `.actor/Dockerfile`. Feel free to configure billing logic in `.actor/pay_per_event.json` and `src/billing.ts`.

[Push your Actor](https://docs.apify.com/academy/deploying-your-code/deploying) to the Apify platform, configure [standby mode](https://docs.apify.com/platform/actors/development/programming-interface/standby), and then connect to the Actor standby URL with your MCP client (e.g., `https://me--my-mcp-server.apify.actor/sse`).

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
