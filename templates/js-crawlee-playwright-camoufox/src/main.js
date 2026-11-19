/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://crawlee.dev
import { PlaywrightCrawler } from '@crawlee/playwright';
// For more information, see https://docs.apify.com/sdk/js
import { Actor } from 'apify';
import { launchOptions as camoufoxLaunchOptions } from 'camoufox';
import { firefox } from 'playwright';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
import { router } from './routes.js';

// Initialize the Apify SDK
await Actor.init();

const { startUrls = ['https://apify.com'] } = (await Actor.getInput()) ?? {};

// `checkAccess` flag ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
// Disable it for short runs if you are sure your proxy configuration is correct
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });
// Camoufox takes the proxy as a Playwright proxy object, not as a URL
const proxy = new URL(await proxyConfiguration.newUrl());

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandler: router,
    launchContext: {
        launcher: firefox,
        launchOptions: await camoufoxLaunchOptions({
            headless: true,
            proxy: {
                server: `${proxy.protocol}//${proxy.host}`,
                username: decodeURIComponent(proxy.username),
                password: decodeURIComponent(proxy.password),
            },
            geoip: true,
            // fonts: ['Times New Roman'], // <- custom Camoufox options
        }),
    },
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
