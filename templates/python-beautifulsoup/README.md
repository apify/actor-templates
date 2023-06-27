# BeautifulSoup and Requests Actor template

A template for scraping data from websites enqueued from starting URL using Python. The URL of the web page is passed in via input, which is defined by the [input schema](https://docs.apify.com/platform/actors/development/input-schema). The template uses the [Requests](https://requests.readthedocs.io/) to get the HTML of the page and the [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) to parse the data from it. Enqueued URLs are available in [request queue](https://docs.apify.com/sdk/python/reference/class/RequestQueue). The data are then stored in a [dataset](https://docs.apify.com/platform/storage/dataset) where you can easily access them.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** - a toolkit for building actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your actor's input
- **[Request queue](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-request-queues)** - queues into which you can put the URLs you want to scrape
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes

## How it works
This code is a Python script that uses the Apify platform to scrape web pages and extract data from them. Here's a brief overview of how it works:

- The script reads the input data from the Actor instance, which is expected to contain a start_urls key with a list of URLs to scrape and a max_depth key with the maximum depth of nested links to follow.
- The script enqueues the starting URLs in the default request queue and sets their depth to 0.
- The script processes the requests in the queue one by one, fetching the URL using requests and parsing it using BeautifulSoup.
- If the depth of the current request is less than the maximum depth, the script looks for nested links in the page and enqueues their targets in the request queue with an incremented depth.
- The script extracts the desired data from the page (in this case, all the links) and pushes it to the default dataset using the push_data method of the Actor instance.
- The script catches any exceptions that occur during the scraping process and logs an error message using the Actor.log.exception method.
- This code demonstrates how to use Python and the Apify SDK to scrape web pages and extract specific data from them.
