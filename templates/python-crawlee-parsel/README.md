## Python Crawlee with Parsel template

<!-- This is an Apify template readme -->

A template for [web scraping](https://apify.com/web-scraping) data from websites starting from provided URLs using Python. The starting URLs are passed through the Actor's input schema, defined by the [input schema](https://docs.apify.com/platform/actors/development/input-schema). The template uses [Crawlee for Python](https://crawlee.dev/python) for efficient web crawling, handling each request through a user-defined handler that uses [Parsel](https://pypi.org/project/parsel/) to extract data from the page. Enqueued URLs are managed in the [request queue](https://crawlee.dev/python/api/class/RequestQueue), and the extracted data is saved in a [dataset](https://crawlee.dev/python/api/class/Dataset) for easy access.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** - a toolkit for building Apify [Actors](https://apify.com/actors) in Python.
- **[Crawlee for Python](https://crawlee.dev/python/)** - a web scraping and browser automation library.
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and validate a schema for your Actor's input.
- **[Request queue](https://crawlee.dev/python/api/class/RequestQueue)** - manage the URLs you want to scrape in a queue.
- **[Dataset](https://crawlee.dev/python/api/class/Dataset)** - store and access structured data extracted from web pages.
- **[Parsel](https://pypi.org/project/parsel/)** - a library for pulling data out of HTML and XML files.

## Resources

- [Video introduction to Python SDK](https://www.youtube.com/watch?v=C8DmvJQS3jk)
- [Webinar introducing to Crawlee for Python](https://www.youtube.com/live/ip8Ii0eLfRY)
- [Apify Python SDK documentation](https://docs.apify.com/sdk/python/)
- [Crawlee for Python documentation](https://crawlee.dev/python/docs/quick-start)
- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
- [Video guide on getting scraped data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)
- A short guide on how to build web scrapers using code templates:

[web scraper template](https://www.youtube.com/watch?v=u-i-Korzf8w)
