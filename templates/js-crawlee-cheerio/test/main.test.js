import { CheerioCrawler, Dataset, purgeDefaultStorages } from '@crawlee/cheerio';
import { beforeAll, describe, expect, it } from 'vitest';

import { router } from '../src/routes.js';

describe('CheerioCrawler', () => {
    beforeAll(async () => {
        await purgeDefaultStorages();
    });

    it('should crawl a page and extract data to dataset', async () => {
        const crawler = new CheerioCrawler({
            maxRequestsPerCrawl: 10,
            requestHandler: router,
        });

        await crawler.run(['https://www.example.com']);

        const { items } = await Dataset.getData();
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].url).toContain('example.com');
        expect(items[0].title).toContain('Example Domain');
    }, 30_000);
});
