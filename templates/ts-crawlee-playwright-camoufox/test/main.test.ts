import { PlaywrightCrawler, purgeDefaultStorages } from '@crawlee/playwright';
import { beforeAll, describe, expect, it } from 'vitest';

import { router } from '../src/routes.js';

describe('PlaywrightCrawler', () => {
    beforeAll(async () => {
        await purgeDefaultStorages();
    });

    it('should crawl and push data to dataset', async () => {
        const crawler = new PlaywrightCrawler({
            maxRequestsPerCrawl: 10,
            requestHandler: router,
        });

        await crawler.run(['https://apify.com']);

        expect(crawler.stats.state.requestsFinished).toBeGreaterThanOrEqual(10);

        const { items } = await crawler.getData();
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].url).toBeDefined();
        expect(items[0].title).toBeDefined();
    }, 60_000);
});
