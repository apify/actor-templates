---
id: crawl-relative-links
title: Crawl a website with relative links
---

If a website uses relative links, [`CheerioCrawler`](/docs/api/cheerio-crawler) and `Apify.enqueueLinks()` may 
have trouble following them.
 This is why it is important to set the `baseUrl` property within `Apify.enqueueLinks()` to `request.loadedUrl`:

{{#code}}../../examples/crawl_relative_links/crawl_relative_links.js{{/code}}
