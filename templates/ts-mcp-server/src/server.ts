/**
 * This module implements the HTTP server for the MCP protocol.
 * It manages session-based transports, request routing, and billing for protocol messages.
 *
 * The server supports streamable HTTP endpoints and handles session
 * initialization, message routing, and resource cleanup on shutdown.
 */
import { randomUUID } from 'node:crypto';

import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { log } from 'apify';
import type { Request, Response } from 'express';
import express from 'express';

import { chargeMessageRequest } from './billing.js';
import { getMcpServer as getMCPServerWithCommand } from './mcp.js';

let getMcpServer: null | (() => Promise<McpServer>) = null;

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

/**
 * Handles POST requests to the /mcp endpoint.
 * - Initializes new sessions and transports if needed.
 * - Routes requests to the correct transport based on session ID.
 * - Charges for each message request.
 */
async function mcpPostHandler(req: Request, res: Response) {
    // Ensure the MCP server is initialized
    if (!getMcpServer) {
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
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    log.info('Received MCP request', {
        sessionId: sessionId || null,
        body: req.body,
    });
    try {
        let transport: StreamableHTTPServerTransport;
        if (sessionId && transports[sessionId]) {
            // Reuse existing transport for the session
            transport = transports[sessionId] as StreamableHTTPServerTransport;
        } else if (!sessionId && isInitializeRequest(req.body)) {
            // New initialization request: create a new transport and event store
            const eventStore = new InMemoryEventStore();
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                eventStore, // Enable resumability
                onsessioninitialized: (initializedSessionId) => {
                    // Store the transport by session ID when session is initialized
                    // This avoids race conditions where requests might come in before the session is stored
                    log.info('Session initialized', {
                        sessionId: initializedSessionId,
                    });
                    transports[initializedSessionId] = transport;
                },
            });

            // Charge for each message request received on this transport
            transport.onmessage = (message) => {
                chargeMessageRequest(message as { method: string }).catch((error) => {
                    log.error('Error charging for message request:', {
                        error,
                        sessionId: transport.sessionId || null,
                    });
                });
            };

            // Clean up transport when closed
            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    log.info('Transport closed', {
                        sessionId: sid,
                    });
                    delete transports[sid];
                }
            };

            // Connect the transport to the MCP server BEFORE handling the request
            // so responses can flow back through the same transport
            const server = await getMcpServer();
            await server.connect(transport);

            await transport.handleRequest(req, res, req.body);
            return; // Already handled
        } else {
            // Invalid request - no session ID or not initialization request
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                },
                id: null,
            });
            return;
        }

        // Handle the request with existing transport - no need to reconnect
        // The existing transport is already connected to the server
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        log.error('Error handling MCP request:', {
            error,
            sessionId: sessionId || null,
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
 * Handles GET requests to the /mcp endpoint for streaming responses.
 * - Validates session ID and resumes or establishes SSE streams as needed.
 */
async function mcpGetHandler(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    // Check for Last-Event-ID header for resumability
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    if (lastEventId) {
        log.info('Client reconnecting', {
            lastEventId: lastEventId || null,
        });
    } else {
        log.info('Establishing new SSE stream', {
            sessionId: sessionId || null,
        });
    }

    const transport = transports[sessionId] as StreamableHTTPServerTransport;
    await transport.handleRequest(req, res);
}

/**
 * Handles DELETE requests to the /mcp endpoint for session termination.
 * - Cleans up and closes the transport for the given session.
 */
async function mcpDeleteHandler(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    log.info('Received session termination request', {
        sessionId: sessionId || null,
    });

    try {
        const transport = transports[sessionId] as StreamableHTTPServerTransport;
        await transport.handleRequest(req, res);
    } catch (error) {
        log.error('Error handling session termination:', {
            error,
        });
        if (!res.headersSent) {
            res.status(500).send('Error processing session termination');
        }
    }
}

/**
 * Starts the MCP HTTP server and sets up all endpoints.
 * - Initializes the MCP server factory.
 * - Registers all HTTP endpoints.
 * - Handles graceful shutdown and resource cleanup.
 */
export async function startServer(options: { serverPort: number; command: string[] }) {
    log.info('Starting MCP HTTP Server', {
        serverPort: options.serverPort,
        command: options.command,
    });
    const { serverPort, command } = options;
    // Initialize the MCP client
    getMcpServer = async () => getMCPServerWithCommand(command);

    const app = express();

    // Redirect to Apify favicon
    app.get('/favicon.ico', (_req: Request, res: Response) => {
        res.writeHead(301, { Location: 'https://apify.com/favicon.ico' });
        res.end();
    });

    // Readiness probe handler
    app.get('/', (req: Request, res: Response) => {
        if (req.headers['x-apify-container-server-readiness-probe']) {
            console.log('Readiness probe');
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
    app.get('/mcp', mcpGetHandler);
    app.delete('/mcp', mcpDeleteHandler);

    app.listen(serverPort, () => {
        log.info(`MCP HTTP Server listening on port ${serverPort}`);
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
        log.info('Shutting down server...');

        // Close all active transports to properly clean up resources
        for (const sessionId of Object.keys(transports)) {
            try {
                log.info(`Closing transport for session ${sessionId}`);
                await transports[sessionId].close();
                delete transports[sessionId];
            } catch (error) {
                log.error(`Error closing transport for session ${sessionId}:`, {
                    error,
                });
            }
        }
        log.info('Server shutdown complete');
        process.exit(0);
    });
}
