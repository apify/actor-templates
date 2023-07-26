/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://docs.apify.com/sdk/js
import { Actor } from 'apify';
// For more information, see https://crawlee.dev
import { CheerioCrawler, Dataset } from 'crawlee';

// Initialize the Apify SDK
await Actor.init();

const { startUrls, maxRequestsPerCrawl } = await Actor.getInput() || { startUrls: ["https://crawlee.com"], maxRequestsPerCrawl: 100 };

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: async ({ enqueueLinks, request, $, log }) => {
        log.info('enqueueing new URLs');
        await enqueueLinks( { globs: ['https://crawlee.com/*'], label: 'detail' });

        const title = $('title').text();
        log.info(`${title}`, { url: request.loadedUrl });

        await Dataset.pushData({ url: request.loadedUrl, title });
    },
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
