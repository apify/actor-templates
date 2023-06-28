# Crawlee & Cheerio template
A web scraping template for crawling a website in Javascript (Node.js) with HTTP requests and Cheerio to parse the HTML. It's fast, but it can't run the website's JavaScript or pass JS anti-scraping challenges.

## Included features
- ***[Apify SDK](https://docs.apify.com/sdk/js)*** - a toolkit for building Actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- ***[Crawlee Cheerio Crawler](https://crawlee.dev/api/cheerio-crawler/class/CheerioCrawler)*** - framework for the parallel crawling of web pages using plain HTTP requests and cheerio HTML parser
- ***[Configurable Proxy](https://docs.apify.com/sdk/js/docs/guides/proxy-management)*** - use your own proxy servers, proxy servers acquired from third-party providers, or you can rely on Apify Proxy for your scraping needs.
- ***[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)*** - store structured data where each object stored has the same attributes



## How it works
1. Define the URLs where to start crawling. 
1. `Actor.createProxyConfiguration();` create a configuration for proxy servers to be used for the crawling. You can read more about proxy configuration options [here](https://crawlee.dev/api/core/interface/ProxyConfigurationOptions).
2. `new CheerioCrawler();` Create an instance of Crawlee's Cheerio Crawler
    - `proxyConfiguration` - provide the created proxy configuration to the crawler
    - `requestHandler` - handle each request with custom router functions defined in the routes.js file.
4. `crawler.run(startUrls);` starts the crawler


## Documentation reference

To learn more about Apify and Actors, take a look at the following resources:

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Crawlee documentation](https://crawlee.dev)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)
