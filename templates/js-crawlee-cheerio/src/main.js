/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://sdk.apify.com
import { Actor } from 'apify';
// For more information, see https://crawlee.dev
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';

// Initialize the Apify SDK
await Actor.init();

const startUrls = ['https://apify.com'];

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandler: router,
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
