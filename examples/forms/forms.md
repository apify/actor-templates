---
id: forms
title: Forms
---

 This example demonstrates how to use [`PuppeteerCrawler`](/docs/api/puppeteer-crawler)
 to automatically fill and submit a search form to look up repositories on
 [GitHub](https://github.com) using headless Chrome / Puppeteer.
 The actor first fills in the search term, repository owner, start date and
 language of the repository, then submits the form and prints out the results.
 Finally, the results are saved either on the Apify platform to the default
 [`dataset`](/docs/api/dataset)
 or on the local machine as JSON files in `./apify_storage/datasets/default`.

> To run this example on the Apify Platform, select the `apify/actor-node-puppeteer-chrome` image for your Dockerfile.

{{#code}}forms.js{{/code}}
