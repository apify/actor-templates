---
id: crawl-some-links
title: Crawl some links on a website
---

This example uses the [`pseudoUrls`](/docs/api/pseudo-url) property in the `Apify.enqueueLinks()` 
method to only add links to the `RequestList` queue if they match the specified regular expression.

<!--DOCUSAURUS_CODE_TABS-->

<!-- CheerioCrawler -->

Using CheerioCrawler:

{{#code}}crawl_some_links_cheerio.js{{/code}}

<!--END_DOCUSAURUS_CODE_TABS-->
