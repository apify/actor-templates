---
id: cheerio-crawler
title: Cheerio crawler
---

 This example demonstrates how to use [`CheerioCrawler`](/docs/api/cheerio-crawler)
 to crawl a list of URLs from an external file,
 load each URL using a plain HTTP request, parse the HTML using [cheerio](https://www.npmjs.com/package/cheerio)
 and extract some data from it: the page title and all H1 tags.

 To run this example on the Apify Platform, select the `Node.js 12 on Alpine Linux (apify/actor-node-basic)` base image
 on the source tab of your actor configuration.


{{#code}}../../templates/cheerio_crawler/main.js{{/code}}