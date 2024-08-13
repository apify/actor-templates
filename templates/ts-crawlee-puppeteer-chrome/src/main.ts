// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/).
import { Actor } from 'apify';
// Web scraping and browser automation library (Read more at https://crawlee.dev)
import { PuppeteerCrawler, Request } from 'crawlee';
import { router } from './routes.js';

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

interface Input {
    startUrls: Request[];
}
// Define the URLs to start the crawler with - get them from the input of the Actor or use a default list.
const {
    startUrls = ['https://crawlee.dev'],
} = await Actor.getInput<Input>() ?? {};

// Create a proxy configuration that will rotate proxies from Apify Proxy.
const proxyConfiguration = await Actor.createProxyConfiguration();

// Create a PuppeteerCrawler that will use the proxy configuration and and handle requests with the router from routes.ts file.
const crawler = new PuppeteerCrawler({
    proxyConfiguration,
    requestHandler: router,
});

// Run the crawler with the start URLs and wait for it to finish.
await crawler.run(startUrls);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
