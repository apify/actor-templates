import { setTimeout } from 'node:timers/promises';

// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
import { CheerioCrawler, Dataset } from '@crawlee/cheerio';
// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';

interface Input {
    startUrls: {
        url: string;
        method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH';
        headers?: Record<string, string>;
        userData: Record<string, unknown>;
    }[];
    maxRequestsPerCrawl: number;
}

// The init() call configures the Actor to correctly work with the Apify-provided environment - mainly the storage infrastructure. It is necessary that every Actor performs an init() call.
await Actor.init();

// Handle graceful abort - Actor is being stopped by user or platform
Actor.on('aborting', async () => {
    // Persist any state, do any cleanup you need, and terminate the Actor using `await Actor.exit()` explicitly as soon as possible
    // This will help ensure that the Actor is doing best effort to honor any potential limits on costs of a single run set by the user
    // Wait 1 second to allow Crawlee/SDK useState and other state persistence operations to complete
    // This is a temporary workaround until SDK implements proper state persistence in the aborting event
    await setTimeout(1000);
    await Actor.exit();
});

// Structure of input is defined in input_schema.json
const { startUrls = ['https://apify.com'], maxRequestsPerCrawl = 100 } =
    (await Actor.getInput<Input>()) ?? ({} as Input);

// `checkAccess` flag ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
// Disable it for short runs if you are sure your proxy configuration is correct
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: async ({ enqueueLinks, request, $, log }) => {
        log.info('enqueueing new URLs');
        await enqueueLinks();

        // Extract title from the page.
        const title = $('title').text();
        log.info(`${title}`, { url: request.loadedUrl });

        // Save url and title to Dataset - a table-like storage.
        await Dataset.pushData({ url: request.loadedUrl, title });
    },
});

await crawler.run(startUrls);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
