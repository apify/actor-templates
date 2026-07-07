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
import { router } from './routes.js';

// Camoufox runs Firefox, and playwright-core (through 1.62) crashes while decoding a
// page's uncaught error that Firefox reports without a source location — it does an
// unguarded `pageError.location.url`. Some sites trigger this (e.g. a React hydration
// error). Survive that one specific decode bug so a broken page can't kill the whole
// run; anything else stays fatal. Remove once the upstream playwright bug is fixed.
process.on('uncaughtException', (err) => {
    if (err instanceof TypeError && /reading 'url'/.test(err.message) && /coreBundle/.test(err.stack ?? '')) {
        log.warning(`Ignored known playwright Firefox pageError decode bug: ${err.message}`);
        return;
    }
    throw err;
});

// Initialize the Apify SDK
await Actor.init();

const { startUrls = ['https://apify.com'] } = (await Actor.getInput()) ?? {};

// `checkAccess` flag ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
// Disable it for short runs if you are sure your proxy configuration is correct
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandler: router,
    launchContext: {
        launcher: firefox,
        launchOptions: await camoufoxLaunchOptions({
            headless: true,
            proxy: await proxyConfiguration.newUrl(),
            geoip: true,
            // fonts: ['Times New Roman'], // <- custom Camoufox options
        }),
    },
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
