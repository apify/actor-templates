/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://crawlee.dev
import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
import { router } from './routes.js';

// Initialize the Apify SDK
await Actor.init();

// If we want to use `@apify/storage-local` instead of the default `@crawlee/memory-storage`,
// we need to first install it via `npm i -D @apify/storage-local@^2.1.0` and provide it
// via `Actor.init` explicitly:
//
// import { ApifyStorageLocal } from '@apify/storage-local';
// const storage = new ApifyStorageLocal();
// await Actor.init({ storage });

interface InputSchema {
    startUrls: string[];
}

const { startUrls = ['https://apify.com'] } = await Actor.getInput<InputSchema>() ?? {};
const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    // Be nice to the websites.
    // Remove to unleash full power.
    maxConcurrency: 50,
    requestHandler: router,
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
