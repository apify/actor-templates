# Selenium & Chrome Actor template

A template example built with Selenium and headless Chrome browser to scrape a website and save the results to storage. The URL of the web page is passed in via input, which is defined by the [input schema](https://docs.apify.com/platform/actors/development/input-schema). The template uses the [Selenium WebDriver](https://www.selenium.dev/documentation/webdriver/) to load and process the page. Enqueued URLs are stored in the default [request queue](https://docs.apify.com/sdk/python/reference/class/RequestQueue). The data are then stored in the default [dataset](https://docs.apify.com/platform/storage/dataset) where you can easily access them.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** - toolkit for building Apify Actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Request queue](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-request-queues)** - queues into which you can put the URLs you want to scrape
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes

## How it works
This code is a Python script that uses the Selenium to scrape web pages and extract data from them. Here's a brief overview of how it works:

- The script reads the input data from the Actor instance, which is expected to contain a `start_urls` key with a list of URLs to scrape and a `max_depth` key with the maximum depth of nested links to follow.
- The script enqueues the starting URLs in the default request queue and sets their depth to 1.
- The script processes the requests in the queue one by one, fetching the URL using requests and parsing it using Selenium.
- If the depth of the current request is less than the maximum depth, the script looks for nested links in the page and enqueues their targets in the request queue with an incremented depth.
- The script extracts the desired data from the page (in this case, titles of each page) and pushes them to the default dataset using the `push_data` method of the Actor instance.
- The script catches any exceptions that occur during the scraping process and logs an error message using the `Actor.log.exception` method.
