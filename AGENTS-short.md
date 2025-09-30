# Apify Actors Development Guide

## Overview

A web scraping service for AI agents and LLM applications that provides up-to-date web content.

## Do

- accept well-defined JSON input and produce structured JSON output
- use Apify SDK (`apify`) for code running ON Apify platform
- validate input early with proper error handling and fail gracefully
- use CheerioCrawler for static HTML content (10x faster than browsers)
- use PlaywrightCrawler only for JavaScript-heavy sites and dynamic content
- use router pattern (createCheerioRouter/createPlaywrightRouter) for complex crawls
- implement retry strategies with exponential backoff for failed requests
- use proper concurrency settings (HTTP: 10-50, Browser: 1-5)
- set sensible defaults in `.actor/input_schema.json` for all optional fields
- clean and validate data before pushing to dataset
- use semantic CSS selectors and fallback strategies for missing elements
- respect robots.txt, ToS, and implement rate limiting with delays
- check which tools (cheerio/playwright/crawlee) are installed before applying guidance

## Don't

- do not rely on `Dataset.getInfo()` for final counts on Cloud platform
- do not use Apify Proxy without "External access" plan or test locally first
- do not use browser crawlers when HTTP/Cheerio works (massive performance cost)
- do not hard code values that should be in input schema or environment variables
- do not skip input validation or error handling
- do not overload servers - use appropriate concurrency and delays
- do not scrape prohibited content or ignore Terms of Service
- do not store personal/sensitive data unless explicitly permitted
- do not use deprecated options like `requestHandlerTimeoutMillis` on CheerioCrawler (v3.x)
- do not use `additionalHttpHeaders` - use `preNavigationHooks` instead

## Commands
```bash
# Local development
apify run                              # Run Actor locally
apify run --purge                      # Run with clean storage
apify run --input-file input.json     # Run with specific input

# Authentication & deployment
apify login                            # Authenticate account
apify push                             # Deploy to Apify platform

# Remote execution
apify call <actorId>                   # Run Actor on platform

# Help
apify help                             # List all commands
```

## Safety and permissions

Allowed without prompt:
- read files with `Actor.getValue()`, `Dataset.getData()`
- push data with `Actor.pushData()`, `Dataset.pushData()`
- set values with `Actor.setValue()`
- enqueue requests to RequestQueue
- run locally with `apify run`

Ask first:
- npm/pip package installations
- apify push (deployment to cloud)
- proxy configuration changes (requires paid plan)
- environment variable modifications in `.actor/actor.json`
- Dockerfile changes affecting builds
- deleting datasets or key-value stores


## Project structure

.actor/
├── actor.json # Actor config: name, version, env vars, runtime settings
└── input_schema.json # Input validation & Console form definition
src/
└── main.ts # Actor entry point and orchestrator
storage/ # Local storage (mirrors Cloud during development)
├── datasets/ # Output items (JSON objects)
├── key_value_stores/ # Files, config, INPUT
└── request_queues/ # Pending crawl requests
Dockerfile # Container image definition
AGENTS.md # AI agent instructions (this file)

## Core Functionality

### Primary Use Cases

1. **Search & Scrape**: Accept search queries, perform search (Google, Bing, DuckDuckGo) and crawl top results
2. **Scrape single URL**: Accept specific URLs and extract their content

### Input Types

- **Search queries**: Natural language search terms (e.g., "vibe-coding is great")
- **URLs**: Specific web page URLs (e.g., "https://apify.vibe-coding.com")

### Input parameters

- `query` (required): Search term or URL
- `maxResults`: Number of search results to scrape (default: 3)
- `scrapingTool`: "raw-http" or "browser-playwright"

### Output format

JSON array containing:

```json
[
    {
        "crawl": {
            "httpStatusCode": 200,
            "httpStatusMessage": "OK", 
            "loadedAt": "2024-11-25T21:23:58.336Z",
            "uniqueKey": "eM0RDxDQ3q",
            "requestStatus": "handled"
        },
        "searchResult": {
            "title": "Page Title",
            "description": "Page description...",
            "url": "https://example.com"
        },
        "metadata": {
            "title": "Full Page Title",
            "description": "Meta description",
            "languageCode": "en",
            "url": "https://example.com"
        },
        "markdown": "# Page content in markdown format..."
    }
]
```

## MCP tools (if configured)

If MCP server is configured, use these tools for documentation:
- `search-apify-docs` - Search documentation
- `fetch-apify-docs` - Get full doc pages
- `search-actors` - Find Actors in store
- `get-html-skeleton` - Get clean HTML structure from URLs

If MCP is not configured, reference: `@https://mcp.apify.com/`

## Resources
- [docs.apify.com/llms.txt](https://docs.apify.com/llms.txt) - Quick reference
- [docs.apify.com/llms-full.txt](https://docs.apify.com/llms-full.txt) - Complete docs
- [crawlee.dev](https://crawlee.dev) - Crawlee documentation
- [whitepaper.actor](https://whitepaper.actor/) - Complete Actor specification

## When stuck
- check which packages are installed (package.json) before suggesting code
- use codebase search to find similar patterns in existing templates
- ask clarifying questions about input requirements or target websites
- propose a crawling strategy before implementing

## Business Model

- Free service (no licensing fees)
- Pay-per-use Apify platform consumption
- Pricing based on Actor Compute Units (1 CU = 1 GB memory × 1 hour)
- Multi-region Google Search support

## Success Metrics

- Response time < 20 seconds for typical queries
- Successful content extraction rate > 95%
- Integration compatibility with major LLM platforms
- Cost efficiency for high-volume usage
