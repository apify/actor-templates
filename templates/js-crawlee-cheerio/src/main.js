// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
import { CheerioCrawler } from '@crawlee/cheerio';
// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
import { router } from './routes.js';

// The init() call configures the Actor to correctly work with the Apify-provided environment - mainly the storage infrastructure. It is necessary that every Actor performs an init() call.
await Actor.init();

// Structure of input is defined in input_schema.json
const { startUrls = ['https://apify.com'], maxRequestsPerCrawl = 100 } = (await Actor.getInput()) ?? {};

// Proxy configuration to rotate IP addresses and prevent blocking (https://docs.apify.com/platform/proxy)
// `checkAccess` flag ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
// Disable it for short runs if you are sure your proxy configuration is correct
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: router,
});

await crawler.run(startUrls);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
