/**
 * This module provides functions to create an MCP server and its proxy client.
 * The proxy client talks to another MCP process over stdio and is started once per Actor run.
 * The MCP server is a thin object created for each HTTP request. It forwards requests
 * and notifications to the shared proxy client.
 */
import { randomUUID } from 'node:crypto';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { Progress } from '@modelcontextprotocol/sdk/types.js';
import {
    ClientNotificationSchema,
    ClientRequestSchema,
    ProgressNotificationSchema,
    ResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { log } from 'apify';

import { chargeMessageRequest } from './billing.js';

// Progress forwarders of the requests in flight, by the progress token sent to the proxied MCP server
const progressForwarders = new Map<string, (progress: Progress) => void>();

/**
 * Creates and configures an MCP server instance for one HTTP request.
 *
 * - Registers all protocol capabilities except experimental.
 * - Forwards requests and notifications to the shared proxy client.
 *
 * The server keeps no state of its own, so creating one for each request is cheap.
 * Progress notifications of a request are sent on the response stream of that request.
 * Other notifications from the proxied MCP server are not forwarded,
 * because a stateless server has no open stream to deliver them on.
 *
 * @param proxyClient - The connected proxy client shared by all requests.
 * @param options - Optional configuration: the request timeout, and the `X-Actor-Request-ID` header
 *   of the HTTP request, which is passed to the charges.
 * @returns A configured McpServer instance.
 */
export function getMcpServer(
    proxyClient: Client,
    options?: {
        timeout?: number;
        requestId?: string;
    },
): McpServer {
    // Create the MCP server instance
    const server = new McpServer({
        name: 'mcp-server',
        version: '1.0.0',
    });

    // Register all capabilities except experimental
    server.server.registerCapabilities({
        tools: {},
        prompts: {},
        resources: {},
        completions: {},
        logging: {},
        tasks: {},
    });

    // Register request handlers for all client requests
    for (const schema of ClientRequestSchema.options) {
        const method = schema.shape.method.value;
        // Forward requests to the proxy client and return its response
        server.server.setRequestHandler(schema, async (req, extra) => {
            if (req.method === 'initialize') {
                // Handle the 'initialize' request separately and do not forward it to the proxy client
                // this is needed for mcp-remote servers to work correctly
                return {
                    capabilities: proxyClient.getServerCapabilities(),
                    // Return back the client protocolVersion
                    protocolVersion: req.params.protocolVersion,
                    serverInfo: {
                        name: 'Apify MCP proxy server',
                        title: 'Apify MCP proxy server',
                        version: '1.0.0',
                    },
                };
            }
            log.info('Received MCP request', {
                method,
                request: req,
            });
            // Charge before the response is sent. After the HTTP request ends, its request ID stops working.
            await chargeMessageRequest(req, options?.requestId).catch((error) => {
                log.error('Error charging for message request:', {
                    error,
                });
            });
            // eslint-disable-next-line no-underscore-dangle
            const progressToken = req.params?._meta?.progressToken;
            if (progressToken === undefined) {
                return proxyClient.request(req, ResultSchema, {
                    timeout: options?.timeout || DEFAULT_REQUEST_TIMEOUT_MSEC,
                });
            }
            // Send progress on the response stream of this request, the only stream a stateless server has.
            // The proxied MCP server gets a token of our own, because tokens of different clients can collide.
            const proxyToken = randomUUID();
            progressForwarders.set(proxyToken, (progress) => {
                extra
                    .sendNotification({
                        method: 'notifications/progress',
                        params: { ...progress, progressToken },
                    })
                    .catch((error) => {
                        log.warning('Error forwarding MCP progress notification', {
                            error,
                        });
                    });
            });
            try {
                // eslint-disable-next-line no-underscore-dangle
                const _meta = { ...req.params?._meta, progressToken: proxyToken };
                return await proxyClient.request({ ...req, params: { ...req.params, _meta } }, ResultSchema, {
                    timeout: options?.timeout || DEFAULT_REQUEST_TIMEOUT_MSEC,
                });
            } finally {
                progressForwarders.delete(proxyToken);
            }
        });
    }

    // Register notification handlers for all client notifications
    for (const schema of ClientNotificationSchema.options) {
        const method = schema.shape.method.value;
        // Forward notifications to the proxy client
        server.server.setNotificationHandler(schema, async (notification) => {
            if (notification.method === 'notifications/initialized') {
                // Do not forward the 'notifications/initialized' notification
                // This is needed for mcp-remote servers to work correctly
                return;
            }
            log.info('Received MCP notification', {
                method,
                notification,
            });
            await proxyClient.notification(notification);
        });
    }

    return server;
}

/**
 * Creates and connects an MCP Proxy Client using a given command.
 *
 * This function splits the provided command string into the executable and its arguments,
 * initializes a StdioClientTransport for communication, and then creates a Client instance.
 * It connects the client to the transport and returns the connected client.
 *
 * @param command - The command to start the MCP proxy process (e.g., 'node server.js').
 * @returns A Promise that resolves to a connected Client instance.
 */
export async function getMcpProxyClient(command: string[]): Promise<Client> {
    log.info('Starting MCP Proxy Client', {
        command,
    });
    // Create a stdio transport for the proxy client
    const transport = new StdioClientTransport({
        command: command[0],
        args: command.slice(1),
    });

    // Create the MCP proxy client instance
    const client = new Client({
        name: 'mcp-proxy-client',
        version: '1.0.0',
    });

    // Route progress notifications to the request they belong to.
    // The `onprogress` request option is not used: the SDK drops a progress notification
    // that arrives in the same chunk as the response to its request.
    client.setNotificationHandler(ProgressNotificationSchema, ({ params }) => {
        const { progressToken, ...progress } = params;
        progressForwarders.get(String(progressToken))?.(progress);
    });

    // Connect the client to the transport
    await client.connect(transport);
    log.info('MCP Proxy Client started successfully');
    return client;
}
