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

```javascript
const { Actor } = require('apify');
const { BasicCrawler } = require('crawlee');

// Apify.main() function wraps the crawler logic (it is optional).
Actor.main(async () => {
    // Create a BasicCrawler - the simplest crawler that enables
    // users to implement the crawling logic themselves.
    const crawler = new BasicCrawler({
        // This function will be called for each URL to crawl.
        async requestHandler({ request, sendRequest }) {
            const { url } = request;
            console.log(`Processing ${url}...`);

            // Fetch the page HTML via Apify utils requestAsBrowser
            const { body } = await sendRequest({ url });

            // Store the HTML and URL to the default dataset.
            await Actor.pushData({
                url: request.url,
                html: body,
            });
        },
    });

    // Run the crawler and wait for it to finish.
    await crawler.run([
        { url: 'http://www.google.com/' },
        { url: 'http://www.example.com/' },
        { url: 'http://www.bing.com/' },
        { url: 'http://www.wikipedia.com/' },
    ]);

    console.log('Crawler finished.');
});
```
