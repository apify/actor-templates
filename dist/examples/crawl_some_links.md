---
id: crawl-some-links
title: Crawl some links on a website
---

This example uses the `pseudoUrls` property in the `Apify.enqueueLinks()` method to only add links to 
the `RequestList` queue if they match the specified regular expression.

<!--DOCUSAURUS_CODE_TABS-->

<!-- CheerioCrawler -->

Using CheerioCrawler:

```javascript
const Apify = require("apify");

Apify.main(async () => {
    // Create a RequestQueue
    const requestQueue = await Apify.openRequestQueue();
    // Define the starting URL
    await requestQueue.addRequest({ url: 'https://apify.com/store' });
    // Function called for each URL
    const handlePageFunction = async ({ request, $ }) => {
        console.log(request.url);
        // Add some links from page to RequestQueue
        await Apify.utils.enqueueLinks({
            $,
            requestQueue,
            baseUrl: request.loadedUrl,
            pseudoUrls: ['http[s?]://apify.com/[.+]/[.+]']
        });
    };
    // Create a CheerioCrawler
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction,
        maxRequestsPerCrawl: 10 // Limitation for only 10 requests (do not use if you want to crawl all links)
    });
    // Run the crawler
    await crawler.run();
});
```

<!-- PuppeteerCrawler -->

Using PuppeteerCrawler:

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.
 
```javascript
const Apify = require("apify");

Apify.main(async () => {
    // Create a RequestQueue
    const requestQueue = await Apify.openRequestQueue();
    // Define the starting URL
    await requestQueue.addRequest({ url: "https://apify.com/store" });
    // Function called for each URL
    const handlePageFunction = async ({ request, page }) => {
        console.log(request.url);
        // Add some links from page to RequestQueue
        await Apify.utils.enqueueLinks({
            page,
            requestQueue,
            pseudoUrls: ['http[s?]://apify.com/[.+]/[.+]']
        });
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction,
        maxRequestsPerCrawl: 10 // Limitation for only 10 requests (do not use if you want to crawl all links)
    });
    // Run the crawler
    await crawler.run();
});
```

<!--END_DOCUSAURUS_CODE_TABS-->
