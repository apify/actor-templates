---
id: crawl-some-links
title: Crawl some links on a website
---

This example uses the `pseudoUrls` property in the `Apify.enqueueLinks` method to only add links to 
the `RequestList` queue if they match the specified regular expression.

<!--DOCUSAURUS_CODE_TABS-->

<!-- CheerioCrawler -->

{{#code}}../../examples/crawl_some_links/crawl_some_links_cheerio.js{{/code}}

<!-- PuppeteerCrawler -->

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.

{{#code}}../../examples/crawl_some_links/crawl_some_links_puppeteer.js{{/code}}

<!--END_DOCUSAURUS_CODE_TABS-->