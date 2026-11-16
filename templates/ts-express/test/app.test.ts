import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Actor } from 'apify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';

describe('Server Actor', () => {
    let server: Server;
    let baseUrl: string;

    const charge = vi.spyOn(Actor, 'charge').mockResolvedValue({
        eventChargeLimitReached: false,
        chargedCount: 1,
        chargeableWithinLimit: {},
    });

    beforeAll(async () => {
        server = createApp({ pool: 'MULTI_TENANT_PAYING_USERS' }).listen(0);
        await new Promise((resolve) => {
            server.once('listening', resolve);
        });
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    beforeEach(() => {
        charge.mockClear();
    });

    afterAll(() => {
        server.close();
    });

    it('answers the readiness probe', async () => {
        const response = await fetch(baseUrl, { headers: { 'x-apify-container-server-readiness-probe': '1' } });

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('ok');
        expect(charge).not.toHaveBeenCalled();
    });

    it('lists its endpoints at /', async () => {
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
        const response = await fetch(`${baseUrl}/greet?name=Apify`, { headers: { 'x-actor-request-id': 'req-1' } });

        expect(await response.json()).toEqual({ message: 'Hello, Apify!' });
        expect(charge).toHaveBeenCalledExactlyOnceWith({
            eventName: 'api-request',
            requestId: 'req-1',
            idempotencyKey: 'req-1:api-request',
        });
    });

    it('serves a request without a request ID, as in a local run', async () => {
        const response = await fetch(`${baseUrl}/greet`);

        expect(await response.json()).toEqual({ message: 'Hello, World!' });
        expect(charge).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ requestId: undefined }));
    });

    it('returns an error and no result when the charge fails', async () => {
        charge.mockRejectedValueOnce(new Error('Charging failed'));

        const response = await fetch(`${baseUrl}/greet`, { headers: { 'x-actor-request-id': 'req-2' } });

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Internal server error' });
    });
});
