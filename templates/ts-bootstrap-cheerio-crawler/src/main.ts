import { CheerioCrawler } from '@crawlee/cheerio';
import { Actor } from 'apify';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
import { router } from './routes.js';

await Actor.init();

// For short runs, you might want to disable the `checkAccess` flag, which ensures the proxy credentials are valid.
const proxyConfiguration = await Actor.createProxyConfiguration({ checkAccess: true });

const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandler: router,
});

await crawler.run(['https://example.com']);

await Actor.exit();
