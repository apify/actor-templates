/**
 * This template is a production ready boilerplate for developing with `StagehandCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://crawlee.dev
import { StagehandCrawler } from '@crawlee/stagehand';
// For more information, see https://docs.apify.com/sdk/js
import { Actor } from 'apify';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
import { router } from './routes.js';

// Initialize the Apify SDK
await Actor.init();

const { startUrls = ['https://apify.com'] } = (await Actor.getInput()) ?? {};

// `checkAccess` flag ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
// Disable it for short runs if you are sure your proxy configuration is correct
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });

const crawler = new StagehandCrawler({
    proxyConfiguration,
    requestHandler: router,
    stagehandOptions: {
        model: 'openai/gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
    },
    launchContext: {
        launchOptions: {
            args: [
                '--disable-gpu', // Mitigates the "crashing GPU process" issue in Docker containers
            ],
        },
    },
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
