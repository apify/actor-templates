---
id: basic-crawler
title: Basic crawler
---

 This is the most bare-bones example of the Apify SDK, which demonstrates some of its
 building blocks such as the [`BasicCrawler`](/docs/api/basic-crawler).
 You probably don't need to go this deep though, and it would be better to start 
 with one of the full featured crawlers like
 [`CheerioCrawler`](https://sdk.apify.com/docs/examples/cheerio-crawler) or
 [`PlaywrightCrawler`](https://sdk.apify.com/docs/examples/playwright-crawler).

 The script simply downloads several web pages with plain HTTP requests using the
 [`Apify.utils.requestAsBrowser()`](/docs/api/utils#requestasbrowser)
 convenience function and stores their raw HTML and URL in the default dataset.
 In local configuration, the data will be stored as JSON files in `./apify_storage/datasets/default`.

{{#code}}basic_crawler.js{{/code}}
