import { readFileSync } from 'node:fs';

import { Actor, log } from 'apify';
import express, { type ErrorRequestHandler, type Express } from 'express';

import type { RunPool } from './run_pool.js';

// The event charged for each request. Define its price in .actor/pay_per_event.json.
const CHARGED_EVENT = 'api-request';

// .actor/openapi.json is the single description of the endpoints. Apify Console renders it on the Actor's
// Server tab (see `webServerSchema` in .actor/actor.json), and this server returns it from GET /openapi.json.
interface OpenApiSpec {
    info: { title: string };
    paths: Record<
        string,
        Record<string, { summary?: string; parameters?: { name: string; in: string; required?: boolean }[] }>
    >;
}
const openApiSpec: OpenApiSpec = JSON.parse(readFileSync(new URL('../.actor/openapi.json', import.meta.url), 'utf8'));

/** Lists the endpoints from the OpenAPI spec, so a program that knows only the Actor's URL can find them. */
function listEndpoints() {
    return Object.entries(openApiSpec.paths).flatMap(([path, operations]) =>
        Object.entries(operations).map(([method, operation]) => ({
            method: method.toUpperCase(),
            path,
            summary: operation.summary,
            parameters: (operation.parameters ?? []).map(({ name, in: location, required = false }) => ({
                name,
                in: location,
                required,
            })),
        })),
    );
}

/**
 * Charges the user who sent the request for one event.
 *
 * The platform adds an `X-Actor-Request-ID` header to every request it forwards to a Server Actor. In a multi-tenant
 * run, the ID tells the platform which user to charge. A single-tenant run ignores it, so the same code works
 * for both tenancies. Requests you send to a local run have no ID, and locally `Actor.charge()` charges nothing.
 *
 * Call this before you send the response. After the request ends, its ID stops working.
 */
async function chargeRequest(requestId: string | undefined) {
    await Actor.charge({
        eventName: CHARGED_EVENT,
        requestId,
        // The platform ignores a repeated charge with the same key, so a retry does not charge the user twice.
        idempotencyKey: requestId ? `${requestId}:${CHARGED_EVENT}` : undefined,
    });
}

export function createApp({ pool }: { pool: RunPool | null }): Express {
    const app = express();

    app.get('/', (req, res) => {
        // The platform sends this request to check that the server is ready. Always answer it.
        // https://docs.apify.com/actors/development/programming-interface/server-actors#readiness-probe
        if (req.get('x-apify-container-server-readiness-probe')) {
            res.send('ok');
            return;
        }

        res.json({
            name: openApiSpec.info.title,
            pool,
            endpoints: listEndpoints(),
            openapi: '/openapi.json',
        });
    });

    app.get('/openapi.json', (_req, res) => {
        res.json(openApiSpec);
    });

    // An example endpoint. Replace it with the work your Actor does for each request.
    app.get('/greet', async (req, res) => {
        const requestId = req.get('x-actor-request-id');
        // The ID of the Apify user who sent the request. In a multi-tenant run, it is the only way to tell users
        // apart, so use it to rate-limit requests or to keep each user's data separate.
        const userId = req.get('x-apify-user-id');
        log.info('Handling GET /greet', { requestId, userId, pool });

        const name = typeof req.query.name === 'string' && req.query.name !== '' ? req.query.name : 'World';
        const result = { message: `Hello, ${name}!` };

        await chargeRequest(requestId);

        res.json(result);
    });

    app.use((_req, res) => {
        res.status(404).json({ error: 'Not found. See GET / for the list of endpoints.' });
    });

    // Express 5 passes errors from async handlers here, including a failed charge.
    const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
        log.exception(error as Error, 'Request failed');
        res.status(500).json({ error: 'Internal server error' });
    };
    app.use(errorHandler);

    return app;
}
