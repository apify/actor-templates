# Python Crawlee & BeautifulSoup Actor Template

<!-- This is an Apify template readme -->

This template example was built with [Crawlee for Python](https://crawlee.dev/python) to scrape data from a website using [Beautiful Soup](https://pypi.org/project/beautifulsoup4/) wrapped into [BeautifulSoupCrawler](https://crawlee.dev/python/api/class/BeautifulSoupCrawler).

## Quick Start

Once you've installed the dependencies, start the Actor:

```bash
apify run
```

Once your Actor is ready, you can push it to the Apify Console:

```bash
apify login # first, you need to log in if you haven't already done so

apify push
```

## Project Structure

```text
.actor/
├── actor.json # Actor config: name, version, env vars, runtime settings
├── dataset_schena.json # Structure and representation of data produced by an Actor
├── input_schema.json # Input validation & Console form definition
└── output_schema.json # Specifies where an Actor stores its output
src/
└── main.py # Actor entry point and orchestrator
storage/ # Local storage (mirrors Cloud during development)
├── datasets/ # Output items (JSON objects)
├── key_value_stores/ # Files, config, INPUT
└── request_queues/ # Pending crawl requests
Dockerfile # Container image definition
```

For more information, see the [Actor definition](https://docs.apify.com/platform/actors/development/actor-definition) documentation.

## How it works

This code is a Python script that uses BeautifulSoup to scrape data from a website. It then stores the website titles in a dataset.

- The crawler starts with URLs provided from the input `startUrls` field defined by the input schema. Number of scraped pages is limited by `maxPagesPerCrawl` field from the input schema.
- The crawler uses `requestHandler` for each URL to extract the data from the page with the BeautifulSoup library and to save the title and URL of each page to the dataset. It also logs out each result that is being saved.

## What's included

- **[Apify SDK](https://docs.apify.com/sdk/python/)** - toolkit for building [Actors](https://apify.com/actors)
- **[Crawlee for Python](https://crawlee.dev/python/)** - web scraping and browser automation library
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Beautiful Soup](https://pypi.org/project/beautifulsoup4/)** - a library for pulling data out of HTML and XML files
- **[Proxy configuration](https://docs.apify.com/platform/proxy)** - rotate IP addresses to prevent blocking

## Resources

- [Quick Start](https://docs.apify.com/platform/actors/development/quick-start) guide for building your first Actor
- [Video introduction to Python SDK](https://www.youtube.com/watch?v=C8DmvJQS3jk)
- [Webinar introducing to Crawlee for Python](https://www.youtube.com/live/ip8Ii0eLfRY)
- [Apify Python SDK documentation](https://docs.apify.com/sdk/python/)
- [Crawlee for Python documentation](https://crawlee.dev/python/docs/quick-start)
- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Integration with Zapier](https://apify.com/integrations), Make, Google Drive and others
- [Video guide on getting data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)

## Creating Actors with templates

[How to create Apify Actors with web scraping code templates](https://www.youtube.com/watch?v=u-i-Korzf8w)
