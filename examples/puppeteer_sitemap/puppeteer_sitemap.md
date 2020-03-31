---
id: puppeteer-sitemap
title: Puppeteer sitemap
---

 This example demonstrates how to use [`PuppeteerCrawler`](/docs/api/puppeteer-crawler) to crawl a list of web pages
 specified in a sitemap. The crawler extracts the page title and URL from each page
 and stores them as a record in the default dataset.
 In local configuration, the results are stored as JSON files in `./apify_storage/datasets/default`.

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.


{{#code}}../../examples/puppeteer_sitemap/puppeteer_sitemap.js{{/code}}
