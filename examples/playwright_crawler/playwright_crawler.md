---
id: playwright-crawler
title: Playwright crawler
---

 This example demonstrates how to use [`PlaywrightCrawler`](../api/playwright-crawler)
 in combination with [`RequestQueue`](../api/request-queue) to recursively scrape the
 [Hacker News website](https://news.ycombinator.com) using headless Chrome / Playwright.

 The crawler starts with a single URL, finds links to next pages,
 enqueues them and continues until no more desired links are available.
 The results are stored to the default dataset. In local configuration, the results are stored as 
 JSON files in `./apify_storage/datasets/default`

 > To run this example on the Apify Platform, select the `apify/actor-node-playwright-chrome` image for your Dockerfile.

{{#code}}playwright_crawler.js{{/code}}
