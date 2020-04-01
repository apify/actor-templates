---
id: basic-crawler
title: Basic crawler
---

 This is the most basic example of the Apify SDK, which demonstrates some of its
 elementary tools such as the [`BasicCrawler`](/docs/api/basic-crawler)
 and [`RequestList`](/docs/api/request-list) classes.
 The script simply downloads several web pages with plain HTTP requests using the
 [`Apify.utils.requestAsBrowser()`](/docs/api/utils#requestasbrowser)
 convenience function and stores their raw HTML and URL in the default dataset.
 In local configuration, the data will be stored as JSON files in `./apify_storage/datasets/default`.

{{#code}}basic_crawler.js{{/code}}
