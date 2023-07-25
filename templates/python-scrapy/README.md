# Scrapy Actor template

A template example built with Scrapy to scrape quotes filtered by input parameters. It shows how to use Apify SDK for Python and Scrapy pipelines to save results.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** - toolkit for building Apify Actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes

## How it works

This code is a Python script that uses Scrapy to scrape web pages and extract data from them. Here's a brief overview of how it works:

- The script reads the input data from the Actor instance, which is expected to contain a `start_urls` key with a list of URLs to scrape and a `max_depth` key with the maximum depth of nested links to follow.
- The script then creates a Scrapy spider that will scrape the URLs and follow links up to the specified `max_depth`. This Spider (class `TitleSpider`) is storing URLs and titles.
- Scrapy pipeline is used to save the results to the default dataset associated with the Actor run using the `push_data` method of the Actor instance.
- The script catches any exceptions that occur during the scraping process and logs an error message using the `Actor.log.exception` method.
