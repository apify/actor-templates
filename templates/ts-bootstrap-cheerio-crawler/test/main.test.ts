import { CheerioCrawler, purgeDefaultStorages } from '@crawlee/cheerio';
import { beforeAll, describe, expect, it } from 'vitest';

import { router } from '../src/routes.js';

describe('CheerioCrawler', () => {
    beforeAll(async () => {
        await purgeDefaultStorages();
    });

    it('should crawl a page using the router', async () => {
        const crawler = new CheerioCrawler({
            maxRequestsPerCrawl: 10,
            requestHandler: router,
        });

        await expect(crawler.run(['https://www.example.com'])).resolves.not.toThrow();
    }, 30_000);
});
