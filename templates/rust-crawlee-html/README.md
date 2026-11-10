# Rust Crawlee & HtmlCrawler Actor Template

<!-- This is an Apify template readme -->

This template example was built with [Crawlee for Rust](https://github.com/apify/crawlee-rs) to scrape data from a website using [HtmlCrawler](https://github.com/apify/crawlee-rs), which parses the pages with [scraper](https://docs.rs/scraper), and the [Apify SDK for Rust](https://github.com/apify/apify-sdk-rs).

## Quick Start

Put the input into `storage/key_value_stores/default/INPUT.json` and start the Actor with Cargo:

```bash
cargo run
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
├── dataset_schema.json # Structure and representation of data produced by an Actor
├── input_schema.json # Input validation & Console form definition
└── output_schema.json # Specifies where an Actor stores its output
src/
├── main.rs # Actor entry point and orchestrator
└── routes.rs # Request handlers of the crawler
storage/ # Local storage (mirrors Cloud during development)
├── datasets/ # Output items (JSON objects)
├── key_value_stores/ # Files, config, INPUT
└── request_queues/ # Pending crawl requests
Cargo.toml # Package manifest and dependencies
Dockerfile # Container image definition
```

For more information, see the [Actor definition](https://docs.apify.com/platform/actors/development/actor-definition) documentation.

## How it works

This code is a Rust program that uses `HtmlCrawler` to scrape data from a website. It then stores the website titles in a dataset.

- The crawler starts with URLs provided from the input `startUrls` field defined by the input schema. Number of scraped pages is limited by `maxRequestsPerCrawl` field from the input schema.
- The crawler uses the router in `src/routes.rs` for each URL to extract the data from the page and to save the title and URL of each page to the dataset. It also logs out each result that is being saved.

Run the tests with `cargo test`.

## What's included

- **[Apify SDK for Rust](https://github.com/apify/apify-sdk-rs)** - toolkit for building [Actors](https://apify.com/actors)
- **[Crawlee for Rust](https://github.com/apify/crawlee-rs)** - web scraping library
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/platform/storage/dataset)** - store structured data where each object stored has the same attributes
- **[scraper](https://docs.rs/scraper)** - HTML parsing and querying with CSS selectors
- **[Proxy configuration](https://docs.apify.com/platform/proxy)** - rotate IP addresses to prevent blocking

## Resources

- [Quick Start](https://docs.apify.com/platform/actors/development/quick-start) guide for building your first Actor
- [Integration with Zapier](https://apify.com/integrations), Make, Google Drive and others
- [Video guide on getting data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)

## Creating Actors with templates

[How to create Apify Actors with web scraping code templates](https://www.youtube.com/watch?v=u-i-Korzf8w)
