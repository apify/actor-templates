---
id: crawl-multiple-urls
title: Crawl multiple URLs
---

This example crawls the specified list of URLs.

<!--DOCUSAURUS_CODE_TABS-->

<!-- BasicCrawler -->

Using BasicCrawler:

{{#code}}../../examples/crawl_multiple_urls/crawl_multiple_urls_basic.js{{/code}}

<!-- CheerioCrawler -->

Using CheerioCrawler:

{{#code}}../../examples/crawl_multiple_urls/crawl_multiple_urls_cheerio.js{{/code}}

<!-- PuppeteerCrawler -->

Using PuppeteerCrawler:

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.

{{#code}}../../examples/crawl_multiple_urls/crawl_multiple_urls_puppeteer.js{{/code}}

<!--END_DOCUSAURUS_CODE_TABS-->

To save some keystrokes, use the `Apify.openRequestList` method:

```javascript
const requestList = await Apify.openRequestList("urls", [
    "http://www.example.com/page-1",
    "http://www.example.com/page-2",
    "http://www.example.com/page-3"
]);
```

You do _not_ have to initialize the `RequestList` when using this syntax.
