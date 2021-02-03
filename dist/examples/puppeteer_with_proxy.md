---
id: puppeteer-with-proxy
title: Puppeteer with proxy
---

 This example demonstrates how to load pages in headless Chrome / Puppeteer
 over [Apify Proxy](https://docs.apify.com/proxy).
 To make it work, you'll need an Apify account with access to the proxy.
 Visit the [Apify platform introduction](/docs/guides/apify-platform) to find
 how to log into your account from the SDK.

> To run this example on the Apify Platform, select the `apify/actor-node-puppeteer-chrome` image for your Dockerfile.


```javascript
const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('my-list', [
        'https://en.wikipedia.org/wiki/Main_Page',
    ]);

    // Proxy connection is automatically established in the Crawler
    const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        proxyConfiguration,
        handlePageFunction: async ({ page }) => {
            const title = await page.title();
            console.log(`Page title: ${title}`);
        },
    });

    console.log('Running Puppeteer script...');
    await crawler.run();
    console.log('Puppeteer closed.');
});
```
