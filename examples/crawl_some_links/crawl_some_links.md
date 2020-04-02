---
id: crawl-some-links
title: Crawl some links on a website
---

This [`CheerioCrawler`](/docs/api/cheerio-crawler) example uses the [`pseudoUrls`](/docs/api/pseudo-url) property 
in the `Apify.enqueueLinks()` method to only add links to the `RequestList` queue if 
they match the specified regular expression.

{{#code}}crawl_some_links_cheerio.js{{/code}}

