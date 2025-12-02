import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod';
import { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import cors from 'cors';
import { log, Actor } from 'apify';

// Initialize the Apify Actor environment
// This call configures the Actor for its environment and should be called at startup
await Actor.init();

const getServer = () => {
    // Create an MCP server with implementation details
    const server = new McpServer(
        {
            name: 'add-tool-mcp-server',
            version: '1.0.0',
        },
        { capabilities: { logging: {} } },
    );

    // Register a tool for adding two numbers with structured output
    server.registerTool(
        'add',
        {
            description: 'Adds two numbers together and returns the sum with structured output',
            inputSchema: {
                a: z.number().describe('First number to add'),
                b: z.number().describe('Second number to add'),
            },
            outputSchema: {
                result: z.number().describe('The sum of a and b'),
                operands: z.object({
                    a: z.number(),
                    b: z.number(),
                }),
                operation: z.string().describe('The operation performed'),
            },
        },
        async ({ a, b }): Promise<CallToolResult> => {
            try {
                // Charge for the tool call
                await Actor.charge({ eventName: 'tool-call' });
                log.info('Charged for tool-call event');

                const sum = a + b;
                const structuredContent = {
                    result: sum,
                    operands: { a, b },
                    operation: 'addition',
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: `The sum of ${a} and ${b} is ${sum}`,
                        },
                    ],
                    structuredContent,
                };
            } catch (error) {
                log.error('Error in add tool:', {
                    error,
                });
                throw error;
            }
        },
    );

    // Create a simple dummy resource at a fixed URI
    server.registerResource(
        'calculator-info',
        'https://example.com/calculator',
        { mimeType: 'text/plain' },
        async (): Promise<ReadResourceResult> => {
            return {
                contents: [
                    {
                        uri: 'https://example.com/calculator',
                        text: 'This is a simple calculator MCP server that can add two numbers together.',
                    },
                ],
            };
        },
    );

    return server;
};

const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
app.use(
    cors({
        origin: '*', // Allow all origins - adjust as needed for production
        exposedHeaders: ['Mcp-Session-Id'],
    }),
);

// Readiness probe handler
app.get('/', (req: Request, res: Response) => {
    if (req.headers['x-apify-container-server-readiness-probe']) {
        log.info('Readiness probe');
        res.end('ok\n');
        return;
    }
    res.status(404).end();
});

app.post('/mcp', async (req: Request, res: Response) => {
    const server = getServer();
    try {
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
            log.info('Request closed');
            transport.close();
            server.close();
        });
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
});

app.get('/mcp', (_req: Request, res: Response) => {
    log.info('Received GET MCP request');
    res.writeHead(405).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        }),
    );
});

app.delete('/mcp', (_req: Request, res: Response) => {
    log.info('Received DELETE MCP request');
    res.writeHead(405).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        }),
    );
});

// Start the server
const PORT = process.env.APIFY_CONTAINER_PORT ? parseInt(process.env.APIFY_CONTAINER_PORT) : 3000;
app.listen(PORT, (error) => {
    if (error) {
        log.error('Failed to start server:', {
            error,
        });
        process.exit(1);
    }
    log.info(`MCP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
    log.info('Shutting down server...');
    process.exit(0);
});
