import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Actor } from 'apify';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import type { RunPool } from '../src/run_pool.js';

describe('Server Actor', () => {
    const servers: Server[] = [];
    const finishRun = vi.fn();

    // What Actor.charge() returns when it charged the event and the spending limit is not reached.
    const charged = { eventChargeLimitReached: false, chargedCount: 1, chargeableWithinLimit: {} };
    const charge = vi.spyOn(Actor, 'charge');

    /** Starts the app for a run in the given pool and returns its URL. */
    async function startApp(pool: RunPool | null) {
        const server = createApp({ pool, finishRun }).listen(0);
        servers.push(server);
        await new Promise((resolve) => {
            server.once('listening', resolve);
        });
        return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    }

    beforeEach(() => {
        finishRun.mockClear();
        charge.mockReset().mockResolvedValue(charged);
    });

    afterAll(() => {
        for (const server of servers) server.close();
    });

    it('answers the readiness probe', async () => {
        const baseUrl = await startApp('MULTI_TENANT_PAYING_USERS');
        const response = await fetch(baseUrl, { headers: { 'x-apify-container-server-readiness-probe': '1' } });

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('ok');
        expect(charge).not.toHaveBeenCalled();
    });

    it('lists its endpoints at /', async () => {
        const baseUrl = await startApp('MULTI_TENANT_PAYING_USERS');
        const response = await fetch(baseUrl);
        const body = await response.json();

        expect(body.pool).toBe('MULTI_TENANT_PAYING_USERS');
        expect(body.endpoints).toContainEqual({
            method: 'GET',
            path: '/greet',
            summary: expect.any(String),
            parameters: [{ name: 'name', in: 'query', required: false }],
        });
        expect(charge).not.toHaveBeenCalled();
    });

    it('charges the request ID of each request', async () => {
        const baseUrl = await startApp('MULTI_TENANT_PAYING_USERS');
        const response = await fetch(`${baseUrl}/greet?name=Apify`, { headers: { 'x-actor-request-id': 'req-1' } });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ message: 'Hello, Apify!' });
        expect(charge).toHaveBeenCalledExactlyOnceWith({
            eventName: 'api-request',
            requestId: 'req-1',
            idempotencyKey: 'req-1:api-request',
        });
    });

    it('serves a request without a request ID, as in a local run', async () => {
        const baseUrl = await startApp(null);
        const response = await fetch(`${baseUrl}/greet`);

        expect(await response.json()).toEqual({ message: 'Hello, World!' });
        expect(charge).toHaveBeenCalledExactlyOnceWith({
            eventName: 'api-request',
            requestId: undefined,
            idempotencyKey: undefined,
        });
    });

    it('does not share one idempotency key between requests with an empty request ID', async () => {
        const baseUrl = await startApp(null);
        await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': '' } });

        expect(charge).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ idempotencyKey: undefined }));
    });

    it('serves a run without pay-per-event pricing, where nothing is charged', async () => {
        // This is what Actor.charge() returns after it logs "Ignored attempt to charge for an event".
        charge.mockResolvedValue({ eventChargeLimitReached: false, chargedCount: 0, chargeableWithinLimit: {} });
        const baseUrl = await startApp('SINGLE_TENANT');

        const response = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-2' } });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ message: 'Hello, World!' });
        expect(finishRun).not.toHaveBeenCalled();
    });

    it('returns no result and finishes a single-tenant run when the spending limit left nothing to charge', async () => {
        charge.mockResolvedValue({ eventChargeLimitReached: true, chargedCount: 0, chargeableWithinLimit: {} });
        const baseUrl = await startApp('SINGLE_TENANT');

        const response = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-3' } });

        expect(response.status).toBe(402);
        expect(await response.json()).toEqual({ error: 'The spending limit of this run is reached.' });
        await vi.waitFor(() => expect(finishRun).toHaveBeenCalledOnce());
    });

    it('returns the result of the request that reaches the spending limit, then finishes a single-tenant run', async () => {
        charge.mockResolvedValue({ eventChargeLimitReached: true, chargedCount: 1, chargeableWithinLimit: {} });
        const baseUrl = await startApp('SINGLE_TENANT');

        const response = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-4' } });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ message: 'Hello, World!' });
        await vi.waitFor(() => expect(finishRun).toHaveBeenCalledOnce());
    });

    it('keeps a multi-tenant run alive when the spending limit is reached', async () => {
        charge.mockResolvedValue({ eventChargeLimitReached: true, chargedCount: 0, chargeableWithinLimit: {} });
        const baseUrl = await startApp('MULTI_TENANT_PAYING_USERS');

        const first = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-5' } });
        // The run still serves the next request.
        charge.mockResolvedValue(charged);
        const second = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-6' } });

        expect(first.status).toBe(402);
        expect(second.status).toBe(200);
        expect(finishRun).not.toHaveBeenCalled();
    });

    it('returns an error and no result when the charge fails', async () => {
        charge.mockRejectedValue(new Error('Charging failed'));
        const baseUrl = await startApp('MULTI_TENANT_PAYING_USERS');

        const response = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-7' } });

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Internal server error' });
        expect(finishRun).not.toHaveBeenCalled();
    });
});
