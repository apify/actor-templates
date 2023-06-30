# Crawlee & Cheerio template

A web scraping template for crawling a website in Javascript (Node.js) with HTTP requests and Cheerio to parse the HTML. The template uses pre-defined functions and features of [Crawlee Cheerio Crawler](https://crawlee.dev/api/cheerio-crawler/class/CheerioCrawler).
It's fast, but it can't run the website's JavaScript or pass JS anti-scraping challenges.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/js)** - a toolkit for building Actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)** - store structured data where each object stored has the same attributes
- **[Crawlee Cheerio Crawler](https://crawlee.dev/api/cheerio-crawler/class/CheerioCrawler)** - framework for the parallel crawling of web pages using plain HTTP requests and cheerio HTML parser
- **[Configurable Proxy](https://docs.apify.com/sdk/js/docs/guides/proxy-management)** - use your own proxy servers, proxy servers acquired from third-party providers, or you can rely on Apify Proxy for your scraping needs.

## How it works
1. Define the input for the crawler - URLs where to start with the crawling. 
1. Create a configuration for proxy servers to be used during the crawling with `Actor.createProxyConfiguration()`. Use Apify Proxy or your own Proxy URLs provided and rotated according to the configuration You can read more about proxy configuration [here](https://crawlee.dev/api/core/class/ProxyConfiguration).
2. Create an instance of Crawlee's Cheerio Crawler with `new CheerioCrawler()`. You can pass [options](https://crawlee.dev/api/cheerio-crawler/interface/CheerioCrawlerOptions) to the crawler constructor as:
    - `proxyConfiguration` - provide the proxy configuration to the crawler
    - `requestHandler` - handle each request with custom router defined in the `routes.js` file.

3. Handle requests with the custom router from `routes.js` file. Read more about custom routing for the Cheerio Crawler [here](https://crawlee.dev/api/cheerio-crawler/function/createCheerioRouter)
    - Create a new router instance with `new createCheerioRouter()`
    - Define default handler that will be called for all URLs that are not handled by other handlers by adding `router.addDefaultHandler(() => { ... })`
    - Define additional handlers - for example for handling the detail pages with `router.addHandler('detail', () => { ... })`
4. `crawler.run(startUrls);` start the crawler and wait for its finish

