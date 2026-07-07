/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://crawlee.dev
import { PlaywrightCrawler } from '@crawlee/playwright';
// For more information, see https://docs.apify.com/sdk/js
import { Actor, log } from 'apify';
import { launchOptions as camoufoxLaunchOptions } from 'camoufox-js';
import { firefox } from 'playwright';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
import { router } from './routes.js';

interface Input {
    startUrls: {
        url: string;
        method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH';
        headers?: Record<string, string>;
        userData: Record<string, unknown>;
    }[];
    maxRequestsPerCrawl: number;
}

// Camoufox runs Firefox, and playwright-core (through 1.62) crashes while decoding a
// page's uncaught error that Firefox reports without a source location — it does an
// unguarded `pageError.location.url`. Some sites trigger this (e.g. a React hydration
// error). Survive that one specific decode bug so a broken page can't kill the whole
// run; anything else stays fatal. Remove once the upstream playwright bug is fixed.
process.on('uncaughtException', (err) => {
    if (err instanceof TypeError && err.message.includes("reading 'url'") && (err.stack ?? '').includes('coreBundle')) {
        log.warning(`Ignored known playwright Firefox pageError decode bug: ${err.message}`);
        return;
    }
    throw err;
});

// Initialize the Apify SDK
await Actor.init();

// Structure of input is defined in input_schema.json
const { startUrls = ['https://apify.com'], maxRequestsPerCrawl = 100 } =
    (await Actor.getInput<Input>()) ?? ({} as Input);

// `checkAccess` flag ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
// Disable it for short runs if you are sure your proxy configuration is correct
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: router,
    launchContext: {
        launcher: firefox,
        launchOptions: await camoufoxLaunchOptions({
            headless: true,
            proxy: await proxyConfiguration?.newUrl(),
            geoip: true,
            // fonts: ['Times New Roman'] // <- custom Camoufox options
        }),
    },
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
