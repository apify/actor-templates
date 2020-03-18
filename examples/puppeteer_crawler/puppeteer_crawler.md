---
id: puppeteer-crawler
title: Puppeteer crawler
---

 This example demonstrates how to use [`PuppeteerCrawler`](/docs/api/puppeteer-crawler)
 in combination with [`RequestQueue`](/docs/api/request-queue) to recursively scrape the
 [Hacker News website](https://news.ycombinator.com) using headless Chrome / Puppeteer.
 The crawler starts with a single URL, finds links to next pages,
 enqueues them and continues until no more desired links are available.
 The results are stored to the default dataset. In local configuration, the results are stored as JSON files in `./apify_storage/datasets/default`

 To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` base image
 on the source tab of your actor configuration.

{{#code}}../../templates/puppeteer_crawler/main.js{{/code}}
