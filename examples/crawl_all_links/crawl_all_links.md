---
id: crawl-all-links
title: Crawl all links on a website
---

This example uses the `Apify.enqueueLinks()` method to add new links to the `RequestQueue` as the crawler navigates 
from page to page. If only the required parameters are defined, all links will be crawled.

<!--DOCUSAURUS_CODE_TABS-->

<!-- CheerioCrawler -->
/
Using `CheerioCrawler`:

{{#code}}crawl_all_links_cheerio.js{{/code}}

<!-- PuppeteerCrawler -->
/
Using `PuppeteerCrawler`:

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.

{{#code}}crawl_all_links_puppeteer.js{{/code}}

<!--END_DOCUSAURUS_CODE_TABS-->
