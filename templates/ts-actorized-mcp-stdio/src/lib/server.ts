// Source: https://github.com/supercorp-ai/supergateway
import express from 'express';
import bodyParser from 'body-parser';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../lib/types.js';
import { getVersion } from '../lib/getVersion.js';
import { onSignals } from '../lib/onSignals.js';
import { chargeMessageRequest } from '../billing.js';

export interface StdioToSseArgs {
  stdioCmd: string
  port: number
  baseUrl?: string
  ssePath?: string
  messagePath?: string
  logger: Logger
}

export async function stdioToSse(args: StdioToSseArgs) {
    const {
        stdioCmd,
        port,
        baseUrl = '',
        ssePath = '/sse',
        messagePath = '/message',
        logger,
    } = args;

    logger.info(`  - port: ${port}`);
    logger.info(`  - stdio: ${stdioCmd}`);
    if (baseUrl) {
        logger.info(`  - baseUrl: ${baseUrl}`);
    }
    logger.info(`  - ssePath: ${ssePath}`);
    logger.info(`  - messagePath: ${messagePath}`);

    onSignals({ logger });

    const child: ChildProcessWithoutNullStreams = spawn(stdioCmd, { shell: true });
    child.on('exit', (code, signal) => {
        logger.error(`Child exited: code=${code}, signal=${signal}`);
        process.exit(code ?? 1);
    });

    const server = new Server(
        { name: 'Actorized MCP', version: getVersion() },
        { capabilities: {} },
    );

    const sessions: Record<
    string,
    { transport: SSEServerTransport }
  > = {};

    const app = express();

    app.use((req, res, next) => {
        // Handle Apify standby readiness probe
        if (req.headers['x-apify-container-server-readiness-probe']) {
            res.writeHead(200);
            res.end('ok');
            return;
        }
        return next();
    });
    app.use(bodyParser.json());

    app.get(ssePath, async (req, res) => {
        logger.info(`New SSE connection from ${req.ip}`);

        const sseTransport = new SSEServerTransport(`${baseUrl}${messagePath}`, res);
        await server.connect(sseTransport);

        const { sessionId } = sseTransport;
        if (sessionId) {
            sessions[sessionId] = { transport: sseTransport };
        }

        sseTransport.onmessage = (msg: JSONRPCMessage) => {
            logger.info(`SSE → Child (session ${sessionId}): ${JSON.stringify(msg)}`);
            child.stdin.write(`${JSON.stringify(msg)}\n`);
        };

        sseTransport.onclose = () => {
            logger.info(`SSE connection closed (session ${sessionId})`);
            delete sessions[sessionId];
        };

        sseTransport.onerror = (err) => {
            logger.error(`SSE error (session ${sessionId}):`, err);
            delete sessions[sessionId];
        };

        req.on('close', () => {
            logger.info(`Client disconnected (session ${sessionId})`);
            delete sessions[sessionId];
        });
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    app.post(messagePath, async (req, res) => {
        const body = req.body as { method: string };
        await chargeMessageRequest(body);
        const sessionId = req.query.sessionId as string;

        if (!sessionId) {
            return res.status(400).send('Missing sessionId parameter');
        }

        const session = sessions[sessionId];
        if (session?.transport?.handlePostMessage) {
            logger.info(`POST to SSE transport (session ${sessionId})`);
            await session.transport.handlePostMessage(req, res, body);
        } else {
            res.status(503).send(`No active SSE connection for session ${sessionId}`);
        }
    });

    app.listen(port, () => {
        logger.info(`Listening on port ${port}`);
        logger.info(`SSE endpoint: http://localhost:${port}${ssePath}`);
        logger.info(`POST messages: http://localhost:${port}${messagePath}`);
    });

    let buffer = '';
    child.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        lines.forEach((line) => {
            if (!line.trim()) return;
            try {
                const jsonMsg = JSON.parse(line);
                logger.info('Child → SSE:', JSON.stringify(jsonMsg));
                for (const [sid, session] of Object.entries(sessions)) {
                    try {
                        session.transport.send(jsonMsg).catch((err) => {
                            logger.error(`Failed to send to session ${sid}:`, err);
                        });
                    } catch (err) {
                        logger.error(`Failed to send to session ${sid}:`, err);
                        delete sessions[sid];
                    }
                }
            } catch {
                logger.error(`Child non-JSON: ${line}`);
            }
        });
    });

    child.stderr.on('data', (chunk: Buffer) => {
        logger.error(`Child stderr: ${chunk.toString('utf8')}`);
    });
}
