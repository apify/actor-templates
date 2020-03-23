---
id: crawl-relative-links
title: Crawl a website with relative links
---

If a website uses relative links, `CheerioCrawler` and `Apify.enqueueLinks` may have trouble following them.
 To fix this, set the `baseUrl` property within `Apify.enqueueLinks` to `request.loadedUrl`:

```javascript
await Apify.enqueueLinks({
    $,
    requestQueue,
    baseUrl: request.loadedUrl
});
```

This is a complete example:

{{#code}}../../examples/crawl_relative_links/crawl_relative_links.js{{/code}}