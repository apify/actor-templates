/**
 * This module implements the HTTP server for the MCP protocol.
 *
 * The server is stateless: each POST request gets its own MCP server and transport,
 * and nothing is kept in memory between requests. The platform starts more runs under load
 * and sends each request to any of them, so a session kept in the memory of one run
 * would be missing in the others.
 */
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { log } from 'apify';
import type { Request, Response } from 'express';
import express from 'express';

import { getMcpProxyClient, getMcpServer } from './mcp.js';

// The proxy client is started once per Actor run and shared by all requests
let proxyClient: Client | null = null;
let isShuttingDown = false;

/**
 * Handles POST requests to the /mcp endpoint.
 * - Creates an MCP server and a transport for this request only.
 */
async function mcpPostHandler(req: Request, res: Response) {
    // Ensure the proxy client is connected
    if (!proxyClient) {
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Server not initialized',
            },
            id: null,
        });
        return;
    }
    log.info('Received MCP request', {
        body: req.body,
    });
    try {
        // The MCP server charges for each message request. It needs the request ID to charge the right user.
        const server = getMcpServer(proxyClient, { requestId: req.get('x-actor-request-id') });
        // No session ID generator means the transport is stateless
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });

        // Release the transport and the server when the response ends
        res.on('close', () => {
            void transport.close();
            void server.close();
        });

        // Connect the transport to the MCP server BEFORE handling the request
        // so responses can flow back through the same transport
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        log.error('Error handling MCP request:', {
            error,
        });
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
}

/**
 * Handles GET and DELETE requests to the /mcp endpoint.
 *
 * A stateless server has no session to stream from or to delete, so only POST is served.
 * Refusing the long-lived GET stream also matters for cost: an open stream can keep a run
 * alive after the client is gone, and the Actor owner pays for the idle run.
 */
function mcpMethodNotAllowedHandler(req: Request, res: Response) {
    log.info(`Received ${req.method} MCP request`);
    res.writeHead(405, { Allow: 'POST', 'Content-Type': 'application/json' }).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        }),
    );
}

/**
 * Starts the MCP HTTP server and sets up all endpoints.
 * - Starts the proxy client shared by all requests.
 * - Registers all HTTP endpoints.
 * - Handles shutdown and resource cleanup.
 */
export async function startServer(options: { serverPort: number; command: string[] }) {
    log.info('Starting MCP HTTP Server', {
        serverPort: options.serverPort,
        executable: options.command[0],
    });
    const { serverPort, command } = options;

    // Start the proxied MCP server. Without it no request can be served,
    // so exit when it stops and let the platform start a new run.
    proxyClient = await getMcpProxyClient(command);
    proxyClient.onclose = () => {
        if (isShuttingDown) return;
        log.error('The proxied MCP server stopped, exiting');
        process.exit(1);
    };

    const app = express();

    // Redirect to Apify favicon
    app.get('/favicon.ico', (_req: Request, res: Response) => {
        res.writeHead(301, { Location: 'https://apify.com/favicon.ico' });
        res.end();
    });

    // Readiness probe handler
    app.get('/', (req: Request, res: Response) => {
        if (req.headers['x-apify-container-server-readiness-probe']) {
            log.info('Readiness probe');
            res.end('ok\n');
            return;
        }
        res.status(404).end();
    });

    // Return the Apify OAuth authorization server metadata to allow the MCP client to authenticate using OAuth
    app.get('/.well-known/oauth-authorization-server', async (_req: Request, res: Response) => {
        // Some MCP clients do not follow redirects, so we need to fetch the data and return it directly.
        const response = await fetch(`https://api.apify.com/.well-known/oauth-authorization-server`);
        const data = await response.json();
        res.status(200).json(data);
    });

    app.use(express.json());

    // Streamable HTTP endpoints
    app.post('/mcp', mcpPostHandler);
    app.get('/mcp', mcpMethodNotAllowedHandler);
    app.delete('/mcp', mcpMethodNotAllowedHandler);

    app.listen(serverPort, () => {
        log.info(`MCP HTTP Server listening on port ${serverPort}`);
    });

    // Handle server shutdown
    const shutdown = async () => {
        log.info('Shutting down server...');
        isShuttingDown = true;
        try {
            await proxyClient?.close();
        } catch (error) {
            log.error('Error closing the proxy client:', {
                error,
            });
        }
        log.info('Server shutdown complete');
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
