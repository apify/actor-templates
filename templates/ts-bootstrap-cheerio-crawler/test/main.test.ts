import { describe, it, expect, beforeAll } from 'vitest';
import { CheerioCrawler, purgeDefaultStorages } from '@crawlee/cheerio';

describe('CheerioCrawler', () => {
    beforeAll(async () => {
        await purgeDefaultStorages();
    });

    it('should crawl a page and extract title', async () => {
        const results = [];

        const crawler = new CheerioCrawler({
            maxRequestsPerCrawl: 1,
            async requestHandler({ request, $ }) {
                const title = $('title').text();
                results.push({ url: request.loadedUrl, title });
            },
        });

        await crawler.run(['https://www.example.com']);

        expect(results.length).toBe(1);
        expect(results[0].url).toContain('example.com');
        expect(results[0].title).toContain('Example Domain');
    }, 30_000);
});
