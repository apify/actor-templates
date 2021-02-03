---
id: crawl-all-links
title: Crawl all links on a website
---

This example uses the `Apify.enqueueLinks()` method to add new links to the `RequestQueue` as the crawler navigates 
from page to page. If only the required parameters are defined, all links will be crawled.

<!--DOCUSAURUS_CODE_TABS-->

<!-- CheerioCrawler -->
\
Using `CheerioCrawler`:

{{#code}}crawl_all_links_cheerio.js{{/code}}

<!-- PuppeteerCrawler -->
\
Using `PuppeteerCrawler`:

> To run this example on the Apify Platform, select the `apify/actor-node-puppeteer-chrome` image for your Dockerfile.

{{#code}}crawl_all_links_puppeteer.js{{/code}}

<!-- PlaywrightCrawler -->
\
Using `PlaywrightCrawler`:

{{#code}}crawl_all_links_playwright.js{{/code}}

> To run this example on the Apify Platform, select the `apify/actor-node-playwright-chrome` image for your Dockerfile.

<!--END_DOCUSAURUS_CODE_TABS-->
