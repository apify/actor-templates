import { describe, it, expect, beforeAll } from 'vitest';
import { PuppeteerCrawler, purgeDefaultStorages } from '@crawlee/puppeteer';

describe('PuppeteerCrawler', () => {
    beforeAll(async () => {
        await purgeDefaultStorages();
    });

    it('should crawl a page and extract title', async () => {
        const results = [];

        const crawler = new PuppeteerCrawler({
            maxRequestsPerCrawl: 1,
            async requestHandler({ request, page }) {
                const title = await page.title();
                results.push({ url: request.loadedUrl, title });
            },
        });

        await crawler.run(['https://www.example.com']);

        expect(results.length).toBe(1);
        expect(results[0].url).toContain('example.com');
        expect(results[0].title).toContain('Example Domain');
    }, 60_000);
});
