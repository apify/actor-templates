---
id: cheerio-crawler
title: Cheerio crawler
---

 This example demonstrates how to use [`CheerioCrawler`](/docs/api/cheerio-crawler)
 to crawl a list of URLs from an external file, load each URL using a plain HTTP request, 
 parse the HTML using the [Cheerio library](https://www.npmjs.com/package/cheerio)
 and extract some data from it: the page title and all `h1` tags.


{{#code}}cheerio_crawler.js{{/code}}
