import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';

await Actor.init();

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandler: router,
});

await crawler.run(['https://example.com']);

await Actor.exit();
