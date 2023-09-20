## JavaScript Crawlee & CheerioCrawler template

This template example was built with [Crawlee](https://crawlee.dev/) to scrape data from a website using [Cheerio](https://cheerio.js.org/) wrapped into [CheerioCrawler](https://crawlee.dev/api/cheerio-crawler/class/CheerioCrawler).

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/js)** - toolkit for building [Actors](https://apify.com/actors)
- **[Crawlee](https://crawlee.dev/)** - web scraping and browser automation library
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Cheerio](https://cheerio.js.org/)** - a fast, flexible & elegant library for parsing and manipulating HTML and XML

## How it works

This code is a JavaScript script that uses Cheerio to scrape data from a website. It then stores the website titles in a dataset.

- The crawler starts with URLs provided from the input `startUrls` field defined by the input schema. Number of scraped pages is limited by `maxPagesPerCrawl` field from the input schema.
- The crawler uses `requestHandler` for each URL to extract the data from the page with the Cheerio library and to save the title and URL of each page to the dataset. It also logs out each result that is being saved.

## Resources

- [Video tutorial](https://www.youtube.com/watch?v=yTRHomGg9uQ) on building a scraper using CheerioCrawler
- [Written tutorial](https://docs.apify.com/academy/web-scraping-for-beginners/challenge) on building a scraper using CheerioCrawler
- [Web scraping with Cheerio in 2023](https://blog.apify.com/web-scraping-with-cheerio/)
- How to [scrape a dynamic page](https://blog.apify.com/what-is-a-dynamic-page/) using Cheerio
- [Integration with Zapier](https://apify.com/integrations), Make, Google Drive and others
- [Video guide on getting data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)

**A short guide on how to create Actors using code templates:**
[web scraper template](https://www.youtube.com/watch?v=u-i-Korzf8w)

