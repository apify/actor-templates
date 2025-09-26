/**
 * This module provides functions to create and manage an MCP server and its proxy client.
 * It registers protocol capabilities, request handlers, and notification handlers for the MCP server,
 * and spawns a proxy client that communicates with another MCP process over stdio.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
    ClientNotificationSchema,
    ClientRequestSchema,
    ResultSchema,
    ServerNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { log } from 'apify';

/**
 * Creates and configures an MCP server instance.
 *
 * - Registers all protocol capabilities except experimental.
 * - Spawns a proxy client to forward requests and notifications.
 * - Sets up handlers for requests and notifications between the server and proxy client.
 * - Handles server shutdown and proxy client cleanup.
 *
 * @param command - The command to start the MCP proxy process.
 * @param options - Optional configuration (e.g., request timeout).
 * @returns A Promise that resolves to a configured McpServer instance.
 */
export async function getMcpServer(
    command: string[],
    options?: {
        timeout?: number;
    },
): Promise<McpServer> {
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
    });

    // Spawn MCP proxy client for the stdio MCP server
    const proxyClient = await getMcpProxyClient(command);

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

    // Register notification handlers for all proxy client notifications
    for (const schema of ServerNotificationSchema.options) {
        const method = schema.shape.method.value;
        // Forward notifications from the proxy client to the server
        proxyClient.setNotificationHandler(schema, async (notification) => {
            log.info('Sending MCP notification', {
                method,
                notification,
            });
            await server.server.notification(notification);
        });
    }

    // Handle server shutdown and cleanup proxy client
    server.server.onclose = () => {
        log.info('MCP Server is closing, shutting down the proxy client');
        proxyClient.close().catch((error) => {
            log.error('Error closing MCP Proxy Client', {
                error,
            });
        });
    };

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
