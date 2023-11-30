import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
import { router } from './routes.js';

await Actor.init();

// Apify Proxy works only when you have access to it, and you're logged in (apify login CLI command)
// const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    // proxyConfiguration,
    requestHandler: router,
});

await crawler.run(['https://example.com']);

await Actor.exit();
