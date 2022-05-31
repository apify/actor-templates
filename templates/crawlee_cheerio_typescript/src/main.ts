/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://crawlee.dev/
import { Actor } from 'apify';
import { CheerioCrawler, log } from '@crawlee/cheerio';
import { handleDetail, handleList, handleStart } from './routes.js';

// If we want to use `@apify/storage-local` instead of the default `@crawlee/memory-storage`,
// we need to first install it via `npm i -D @apify/storage-local@^2.1.0` and provide it
// via `Actor.init` explicitly:
//
// import { ApifyStorageLocal } from '@apify/storage-local';
// const storage = new ApifyStorageLocal();
// await Actor.init({ storage });
await Actor.init();

interface InputSchema {
    startUrls: string[];
    debug?: boolean;
}

const { startUrls = [], debug } = await Actor.getInput<InputSchema>() ?? {};

if (debug) {
    log.setLevel(log.LEVELS.DEBUG)
}

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    // Be nice to the websites.
    // Remove to unleash full power.
    maxConcurrency: 50,
    async requestHandler(context) {
        const { request, log } = context;
        const { url, label } = request;
        log.info('Page opened.', { label, url });
        switch (label) {
            case 'LIST':
                return handleList(context);
            case 'DETAIL':
                return handleDetail(context);
            default:
                return handleStart(context);
        }
    },
});

await crawler.addRequests(startUrls);

log.info('Starting the crawl.');
await crawler.run();
log.info('Crawl finished.');

await Actor.exit();
