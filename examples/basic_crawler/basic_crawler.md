---
id: basic-crawler
title: Basic crawler
---

 This is the most basic example of the Apify SDK, which demonstrates some of its
 elementary tools, such as the
 [`BasicCrawler`](/docs/api/basic-crawler)
 and [`RequestList`](/docs/api/request-list) classes.
 The script just downloads several web pages with plain HTTP requests using the
 [`Apify.utils.requestAsBrowser()`](/docs/api/utils#requestasbrowser)
 convenience function and stores their raw HTML and URL to the default dataset.
 In local configuration, the data will be stored as JSON files in `./apify_storage/datasets/default`.

 To run this example on the Apify Platform, select the `Node.js 12 on Alpine Linux (apify/actor-node-basic)` base image
 on the source tab of your actor configuration.


{{#code}}../../examples/basic_crawler/basic_crawler.js{{/code}}
