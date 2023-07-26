# Cheerio Actor template

A template example built with [Crawlee](https://crawlee.dev) to scrape data from a website using [Cheerio](https://cheerio.js.org/).

## Included features

- **[Crawlee](https://docs.apify.com/sdk/python/)** - toolkit for building Apify Actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Cheerio](https://cheerio.js.org/)** - a fast, flexible & elegant library for parsing and manipulating HTML and XML

## How it works

This code is a JavaScript script that uses Cheerio to scrape data from a website. It then stores the website titles in a dataset.

- The script loads the HTML of the provided URLs from `startUrls` field in input schema.
- Uses Cheerio `requestHandler` function to scrape the website titles.
- Number of crawls is limited by `maxPagesPerCrawl` field from input schema.
- Then the results are saved to a dataset.
