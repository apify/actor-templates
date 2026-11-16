/**
 * This module provides functions to create an MCP server and its proxy client.
 * The proxy client talks to another MCP process over stdio and is started once per Actor run.
 * The MCP server is a thin object created for each HTTP request. It forwards requests
 * and notifications to the shared proxy client.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { ClientNotificationSchema, ClientRequestSchema, ResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { log } from 'apify';

/**
 * Creates and configures an MCP server instance for one HTTP request.
 *
 * - Registers all protocol capabilities except experimental.
 * - Forwards requests and notifications to the shared proxy client.
 *
 * The server keeps no state of its own, so creating one for each request is cheap.
 * Notifications that the proxied MCP server sends on its own are not forwarded,
 * because a stateless server has no open stream to deliver them on.
 *
 * @param proxyClient - The connected proxy client shared by all requests.
 * @param options - Optional configuration (e.g., request timeout).
 * @returns A configured McpServer instance.
 */
export function getMcpServer(
    proxyClient: Client,
    options?: {
        timeout?: number;
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
        server.server.setRequestHandler(schema, async (req) => {
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
            return proxyClient.request(req, ResultSchema, {
                timeout: options?.timeout || DEFAULT_REQUEST_TIMEOUT_MSEC,
            });
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

    // Connect the client to the transport
    await client.connect(transport);
    log.info('MCP Proxy Client started successfully');
    return client;
}
