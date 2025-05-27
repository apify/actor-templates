## Python MCP Server Template

A Python template for deploying and monetizing a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server in the cloud using the [Apify platform](https://docs.apify.com/platform/actors).

This template enables you to:
- Run any Python stdio MCP server remotely via [Server-Sent Events (SSE) transport](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse).
- Deploy the server as a [standby Actor](https://docs.apify.com/platform/actors/development/programming-interface/standby) on Apify.
- Connect to the server using an [MCP client](https://modelcontextprotocol.io/clients).

Key features:
- Deploy existing Python stdio MCP servers, such as [ArXiv MCP Server](https://github.com/blazickjp/arxiv-mcp-server), to Apify.
- Configure billing logic with the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) model.
- Integrate with MCP clients via SSE transport.

Implementation details:
- Supports multiple client types: stdio, SSE, and streamable HTTP
- Flexible server modes: server (standalone) and client (proxy to remote server)
- Built on the official MCP SDK for robust protocol implementation
- Handles session management and billing integration
- Provides health monitoring and status endpoints
- Supports CORS configuration for web clients
- Implements proper error handling and logging

## Usage Examples
