import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { ClientNotificationSchema, ClientRequestSchema , ServerNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { log } from "apify";
import { z } from "zod";

export async function getMcpServer(command: string, options?: {
    timeout?: number;
}): Promise<McpServer> {
    const server = new McpServer({
      name: "mcp-server",
      version: "1.0.0",
    });
    
    // Register all capabilities except experimental
    server.server.registerCapabilities({
        tools: {},
        prompts: {},
        resources: {},
        completions: {},
        logging: {},
    })
    
    const proxyClient = await getMcpProxyClient(command);
    
    // Register request handlers for all client requests
    for (const schema of ClientRequestSchema.options) {
        const method = schema.shape.method.value;
        server.server.setRequestHandler(schema, async (req) => {
            log.info('Received MCP request', {
                method,
                request: req,
            });
            return proxyClient.request(req, z.any(), {
                timeout: options?.timeout || DEFAULT_REQUEST_TIMEOUT_MSEC,
            });
        });
    }
    
    
    // Register notification handlers for all client notifications
    for (const schema of ClientNotificationSchema.options) {
        const method = schema.shape.method.value;
        server.server.setNotificationHandler(schema, async (notification) => {
            log.info('Received MCP notification', {
                method,
                notification,
            });
            return proxyClient.notification(notification);
        });
    }
    
    // Register notification handlers for all proxy client notifications
    for (const schema of ServerNotificationSchema.options) {
        const method = schema.shape.method.value;
        proxyClient.setNotificationHandler(schema, async (notification) => {
            log.info('Sending MCP notification', {
                method,
                notification,
            });
            await server.server.notification(notification);
        });
    }
    
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
export async function getMcpProxyClient(command: string): Promise<Client> {
    log.info('Starting MCP Proxy Client', {
        command,
    });
    const commandParts = command.split(' ');
    const transport = new StdioClientTransport({
        command: commandParts[0],
        args: commandParts.slice(1),
    });

    const client = new Client({
        name: 'mcp-proxy-client',
        version: '1.0.0',
    });

    await client.connect(transport);
    log.info('MCP Proxy Client started successfully');
    return client;
}
