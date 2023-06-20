# Crawlee & Cheerio template

## Included features
- [Apify SDK](https://docs.apify.com/sdk/js) - a toolkit for building actors
- [Crawlee Cheerio Crawler](https://crawlee.dev/api/cheerio-crawler/class/CheerioCrawler) - framework for the parallel crawling of web pages using plain HTTP requests and cheerio HTML parser
- [Configurable Proxy](https://docs.apify.com/sdk/js/docs/guides/proxy-management) - use your own proxy servers, proxy servers acquired from third-party providers, or you can rely on Apify Proxy for your scraping needs.
- [Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset) - store structured data where each object stored has the same attributes



## How it works

1. `Actor.createProxyConfiguration();` creates a configuration for proxy servers to be used for the crawling
2. `new CheerioCrawler();` Creates an instance of Crawlee's Cheerio Crawler
    - `proxyConfiguration` - provides the created proxy configuration to the crawler
    - `requestHandler` - 
4. `crawler.run(startUrls);` starts the crawler


## Documentation reference

To learn more about Apify and Actors, take a look at the following resources:

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Crawlee documentation](https://crawlee.dev)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)
