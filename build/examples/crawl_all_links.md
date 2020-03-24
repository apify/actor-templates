---
id: crawl-all-links
title: Crawl all links on a website
---

This example uses the `Apify.enqueueLinks` method to add new links to the `RequestQueue` as the crawler navigates from page to page. If only the required parameters are defined, all links will be crawled.

<!--DOCUSAURUS_CODE_TABS-->

<!-- CheerioCrawler -->

```javascript
const Apify = require("apify");

Apify.main(async () => {
    // Create a RequestQueue
    const requestQueue = await Apify.openRequestQueue();
    // Define the starting URL
    await requestQueue.addRequest({ url: "http://www.apify.com" });
    // Function called for each URL
    const handlePageFunction = async ({ request, $ }) => {
        console.log(request.url);
        // Add all links from page to RequestQueue
        await Apify.enqueueLinks({
            $,
            requestQueue
        });
    };
    // Create a CheerioCrawler
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction
    });
    // Run the crawler
    await crawler.run();
});
```

<!-- PuppeteerCrawler -->

```javascript
const Apify = require("apify");

Apify.main(async () => {
    // Create a RequestQueue
    const requestQueue = await Apify.openRequestQueue();
    // Define the starting URL
    await requestQueue.addRequest({ url: "http://www.apify.com" });
    // Function called for each URL
    const handlePageFunction = async ({ request, page }) => {
        console.log(request.url);
        // Add all links from page to RequestQueue
        await Apify.enqueueLinks({
            page,
            requestQueue
        });
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction
    });
    // Run the crawler
    await crawler.run();
});
```

<!--END_DOCUSAURUS_CODE_TABS-->