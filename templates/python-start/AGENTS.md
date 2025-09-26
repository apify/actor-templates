# Apify Actors Development Guide

## What are Apify Actors?

- Actors are serverless programs that run in the cloud. They're inspired by the UNIX philosophy - programs that do one thing well and can be easily combined to build complex systems.
- Actors are programs packaged as Docker images that run in isolated containers

## Apify Actors Core Concept

- Accept well-defined JSON input
- Perform isolated tasks (web scraping, automation, data processing)
- Produce structured JSON output
- Can run from seconds to hours or even indefinitely
- Persist state and can be restarted

## Key Apify Libraries

### Apify CLI (`apify-cli`)

```bash
# Key commands
apify create, apify run, apify push, apify login
```

- Purpose: Development workflow and deployment tool
- Use for: Local development, testing, and deployment

### Apify Python SDK (`apify`)

```python
# Main class: Actor
from apify import Actor
# Key methods: init, get_input, push_data, set_value, exit
```

- Purpose: Building Actors that run ON the Apify platform
- Use for: Actor logic that runs on Apify platform

### Apify Python Client (`apify-client`)

```python
# Main class: ApifyClient
from apify_client import ApifyClient
client = ApifyClient(token='your-token')
```

- Purpose: Calling Apify API from external applications
- Use for: External apps, webhooks, orchestration systems

**Key Distinction:** SDK is for code RUNNING on Apify, Client is for code CALLING Apify.

## Actor Commands

Apify CLI helps you manage the Apify cloud platform and develop, build, deploy, and run Apify Actors.

```bash
# Prints out help about a command, or all available commands
apify help

# Executes Actor locally with simulated Apify environment variables
apify run

# Run locally with clean storage
apify run --purge

# Run locally with specific input file
apify run --input-file input.json

# Authenticates your Apify account and saves credentials to '~/.apify/auth.json'
apify login

# Deploys Actor to Apify platform using settings from '.actor/actor.json'
apify push

# Executes Actor remotely using your authenticated account
apify call <actorId>
```

## Actor Project Structure

The following folders and files are the most important for Apify Actor development.

- `.actor/`: Apify Actor configuration
    - `actor.json`: Main Actor configuration. This file includes the Actor’s name, version, build tag, environment variables, and other runtime settings.
    - `input_schema.json`: Defines and validates the Actor’s input and powers the input form in the Apify Console.
- `src/`: Core source code
    - `main.py`: Actor entry point and orchestrator.
- `Dockerfile`: Container image definition used to build and run the Actor locally and on the Apify platform.
- `AGENTS.md`: Project-specific AI agent rules and instructions. Any AI agent working in this repository must follow the instructions in this file at all times.
- `storage/`: Local storage (mirrors Apify platform storages during local runs)
    - `datasets/`: Stores output items (each item is a JSON object produced by the Actor).
    - `key_value_stores/`: Key–value storage. The default store contains `INPUT` (the Actor’s input).
    - `request_queues/`: Persistent queues of pending requests used for crawling and automation flows.

## Storage Systems

Actors provide three storage types:

### Dataset - Structured Results

```python
# Key methods: Actor.push_data(), Dataset.push_data()
await Actor.push_data(data)
dataset = await Dataset.open('name')
await dataset.export_to_csv('./results.csv')
```

- Append-only storage for scraping results
- Like a database table for collected data
- Supports JSON, CSV export formats

### Key-Value Store - Files & Configuration

```python
# Key methods: Actor.set_value(), Actor.get_value(), KeyValueStore
await Actor.set_value(key, value)
data = await Actor.get_value(key)
store = await KeyValueStore.open()
```

- Store objects, files, and configuration
- Auto JSON serialization for objects
- Support for binary data with content types

### Request Queue - URLs to Crawl

```python
# Key class: RequestQueue
queue = await RequestQueue.open()
await queue.add_request({'url': url, 'user_data': user_data})
```

- Managed by crawling libraries (Crawlee)
- Handles deduplication and retry logic
- Supports breadth-first and depth-first crawling

## Crawlee - Web Scraping Framework

Crawlee is a powerful web scraping and browser automation library that makes building reliable crawlers fast and efficient.

Note: Only apply the guidance in this section if the `crawlee` package is installed (i.e., listed in `requirements.txt` or `pyproject.toml`). In addition, the agent should check which tools are actually used in this project and follow only the relevant parts:

- If using BeautifulSoup-based flows (e.g., `BeautifulSoupCrawler` or standalone `beautifulsoup4`), apply the BeautifulSoup guidance.
- If using real browsers (e.g., `PlaywrightCrawler` or `playwright`), apply the Playwright guidance.
- If using other Crawlee crawlers (e.g., `ParselCrawler`), apply only those relevant sections.

If `crawlee` is not installed or the corresponding tool is not used, ignore the related guidance.

### Version Compatibility Notes

**Python Crawlee + Apify SDK Compatibility:**
- `BeautifulSoupCrawler` uses different parameter names compared to JavaScript version
- Use `pre_navigation_hooks` for setting headers instead of deprecated options
- Prefer `pre_navigation_hooks` or custom request handling to set headers/cookies on HTTP crawlers
- Parameter names use snake_case convention - check current documentation for exact API

### BeautifulSoupCrawler (HTTP + HTML Parsing)

```python
# Class: BeautifulSoupCrawler
from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext

crawler = BeautifulSoupCrawler(
    max_requests_per_crawl=10,
)

@crawler.router.default_handler
async def request_handler(context: BeautifulSoupCrawlingContext) -> None:
    # BeautifulSoup selector access via context.soup
    soup = context.soup
    request = context.request
    # Use context.enqueue_links() for link extraction
    await context.enqueue_links()
```

- Best for: Static HTML content, Server-rendered content, fastest option (~10x faster than browsers)
- Use cases: E-commerce sites, news sites, listings, server-rendered content
- Performance: Can scrape 500+ pages per minute with 4GB memory

#### Anti-Bot Protection for HTTP Crawling

Before switching to browsers, try these "HTTP-first" mitigation patterns:

```python
from crawlee.crawlers import BeautifulSoupCrawler

crawler = BeautifulSoupCrawler(
    max_requests_per_crawl=10,
    # Add custom headers via request_handler or httpx_client configuration
)

@crawler.router.default_handler
async def request_handler(context: BeautifulSoupCrawlingContext) -> None:
    # Custom headers can be set via the underlying HTTP client
    # or through crawler configuration
    context.request.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
    })
```

**Key strategies:**
- **Stable headers**: Use consistent, realistic browser headers
- **Locale stabilization**: Set `Accept-Language: en`, or any other relevant language
- **Cookie consent handling**: Selectively preserve or strip cookies via custom request handling
- **Request timing**: Add delays between requests to avoid rate limiting

### PlaywrightCrawler (Real Browser)

```python
# Class: PlaywrightCrawler
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

crawler = PlaywrightCrawler(
    max_requests_per_crawl=10,
    headless=True,
)

@crawler.router.default_handler
async def request_handler(context: PlaywrightCrawlingContext) -> None:
    # Full browser page access
    page = context.page
    request = context.request
    # Use context.enqueue_links() for link extraction
    await context.enqueue_links()
```

- Best for: JavaScript-heavy sites, dynamic content, modern SPAs
- Use cases: Social media, modern web apps, complex interactions and authentication, sites requiring JavaScript rendering

### AdaptiveCrawler (Smart Switching)

```python
# Class: AdaptivePlaywrightCrawler
crawler = AdaptivePlaywrightCrawler(
    rendering_type_detection_ratio=0.1
)
```

- Automatically decides: whether to use HTTP or browser based on content analysis
- Best for: Mixed content sites where some pages need JS, others don't

### Key Crawlee Features

#### Request Queue & State Management

```python
# Classes: RequestQueue, KeyValueStore
request_queue = await RequestQueue.open()
store = await KeyValueStore.open()
```

- Persistent queues that survive restarts
- State management with key-value storage
- Custom request routing and labeling

#### Proxy Configuration & Anti-Bot Protection

```python
# Class: ProxyConfiguration
proxy_configuration = ProxyConfiguration(
    groups=['RESIDENTIAL', 'DATACENTER']
)
```

- Built-in proxy rotation support
- Anti-bot protection with fingerprinting
- Session management for consistent crawling

#### Router Pattern for Complex Crawls

```python
# Router pattern using crawler.router decorators
from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext

crawler = BeautifulSoupCrawler()

@crawler.router.handler('PRODUCT')
async def product_handler(context: BeautifulSoupCrawlingContext) -> None:
    soup = context.soup
    request = context.request
    # Handler logic here
```

- Handle different page types with dedicated handlers
- Clean separation of scraping logic
- Scalable architecture for large projects

#### BeautifulSoup Router Pattern Example

```python
from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext
import re

crawler = BeautifulSoupCrawler(max_requests_per_crawl=100)

# Category page handler
@crawler.router.handler('CATEGORY')
async def category_handler(context: BeautifulSoupCrawlingContext) -> None:
    soup = context.soup
    request = context.request
    
    # Enqueue product detail pages
    await context.enqueue_links(
        selector='.product-item a',
        label='PRODUCT',
    )
    
    # Handle pagination
    await context.enqueue_links(
        selector='.pagination .next',
        label='CATEGORY',
    )

# Product detail handler
@crawler.router.handler('PRODUCT')
async def product_handler(context: BeautifulSoupCrawlingContext) -> None:
    soup = context.soup
    request = context.request
    
    title_elem = soup.select_one('h1.product-title')
    price_elem = soup.select_one('.price')
    description_elem = soup.select_one('.product-description')
    availability_elem = soup.select_one('.availability')
    
    product = {
        'url': request.loaded_url,
        'title': title_elem.get_text(strip=True) if title_elem else None,
        'price': parse_price(price_elem.get_text() if price_elem else ''),
        'images': [img.get('src') for img in soup.select('.product-images img') if img.get('src')],
        'description': description_elem.get_text(strip=True) if description_elem else None,
        'availability': 'in_stock' if availability_elem and 'skladem' in availability_elem.get_text() else 'out_of_stock',
    }
    
    # Clean empty fields
    clean_product = {k: v for k, v in product.items() if v is not None and v != ''}
    
    # Use context.push_data() instead of Actor.push_data()
    await context.push_data(clean_product)

def parse_price(price_text):
    if not price_text:
        return None
    match = re.search(r'(\d+(?:\s?\d+)*)[,.]?(\d{0,2})', price_text)
    if match:
        price_str = match.group(0).replace(' ', '').replace(',', '.')
        return float(price_str)
    return None
```

## Apify Proxy Integration

```python
# Method: Actor.create_proxy_configuration
proxy_config = await Actor.create_proxy_configuration(
    groups=['RESIDENTIAL'],
    country_code='US'
)
```

- Easy proxy configuration
- Geographic targeting
- Residential and datacenter proxies

## Cloud vs Local Development Differences

### Common Pitfalls

**Counting Results:**
- Avoid relying on `Dataset.open().getInfo()` at the end of runs for "items scraped" status on Cloud
- The count may lag on Cloud platform
- Prefer an internal counter incremented when pushing items or use final dataset export

**Proxy Access:**
- Apify Proxy requires "External access" plan for usage
- Use "no proxy" locally or create `Actor.createProxyConfiguration()` only when enabled on Cloud
- Test proxy configuration separately before deploying

**Browser Dependencies:**
- Playwright/Puppeteer browsers install locally vs pre-baked options in base images on Cloud
- Local development may require additional browser installation steps
- Cloud base images come with browsers pre-installed

## Actor Environment Variables

Learn how to control your Actor’s behavior using environment variables provided by the Apify platform and your own custom variables.

### How to use environment variables in an Actor

You can set environment variables in two ways:
- In `.actor/actor.json` (local definition)
- In the Apify Console (Actor → Source → Environment variables)

Precedence: The local `.actor/actor.json` overrides variables set in the Apify Console. To use Console values, remove the `environmentVariables` key from your local file.

### Set up environment variables in `actor.json`

Define custom variables in `.actor/actor.json` (applied when you build/push with the Apify CLI):

```json
{
  "actorSpecification": 1,
  "name": "dataset-to-mysql",
  "version": "0.1",
  "buildTag": "latest",
  "environmentVariables": {
    "MYSQL_USER": "my_username"
  }
}
```

Git workflow notice: Variables in `.actor/actor.json` are applied when using the Apify CLI. If you deploy via Git integration, define variables in the Apify Console instead.

### Set up environment variables in the Apify Console

1. Open your Actor’s Source page in the Apify Console.
2. Navigate to Environment variables.
3. Add your custom variables.

For secrets (API keys, passwords), enable Secret to encrypt values and redact them in logs.

Build-time variables: Once a build starts, its environment variables are locked. To change them, create a new build. See the Apify docs for details on builds.

### Access environment variables

```python
import os
from apify import Actor

await Actor.init()

mysql_user = os.getenv('MYSQL_USER')
print(mysql_user)

await Actor.exit()
```

## Input Schema Best Practices

### Production-Ready Input Schema

Here's a complete `.actor/input_schema.json` example for e-commerce scraping:

```json
{
  "title": "E-commerce Product Scraper Input",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "start_urls": {
      "title": "Start URLs",
      "type": "array",
      "description": "URLs to start scraping from (category pages or product pages)",
      "editor": "requestListSources",
      "default": [{"url": "https://example.com/category"}],
      "prefill": [{"url": "https://example.com/category"}]
    },
    "follow_variants": {
      "title": "Follow Product Variants",
      "type": "boolean",
      "description": "Whether to scrape product variants (different colors, sizes)",
      "default": true
    },
    "max_requests_per_crawl": {
      "title": "Max Requests per Crawl",
      "type": "integer",
      "description": "Maximum number of pages to scrape (0 = unlimited)",
      "default": 1000,
      "minimum": 0
    },
    "proxy_configuration": {
      "title": "Proxy Configuration",
      "type": "object",
      "description": "Proxy settings for anti-bot protection",
      "editor": "proxy",
      "default": {"use_apify_proxy": false}
    },
    "locale": {
      "title": "Locale",
      "type": "string",
      "description": "Language/country code for localized content",
      "default": "cs",
      "enum": ["cs", "en", "de", "sk"],
      "enumTitles": ["Czech", "English", "German", "Slovak"]
    }
  },
  "required": ["start_urls"]
}
```

### Key Input Schema Guidelines

- **Use `editor: "requestListSources"`** for URL inputs to get the rich URL editor
- **Use `editor: "proxy"`** for proxy configuration with built-in Apify Proxy integration
- **Set sensible defaults** for all optional fields
- **Use `enumTitles`** for user-friendly dropdown labels
- **Enable proxy only when needed** on Cloud (requires External access plan)
- **Include validation** with `minimum`, `maximum`, `pattern` where appropriate

## Actor Status & Lifecycle

Run States: READY → RUNNING → SUCCEEDED/FAILED/ABORTED/TIMED-OUT

### Status Management

```python
# Status methods
await Actor.set_status_message('Processing page 1/100')
await Actor.exit('Successfully completed')
await Actor.fail('Error: Invalid input')
```

- Progress updates for users
- Custom exit messages
- Error handling with explanations

## Deployment & Monetization

### Deployment

```bash
apify push
```

- Local development to cloud deployment workflow
- Automated build and deployment process

### Monetization Models

```python
# Charging method
await Actor.charge(
    event_name='api-call'
)
```

## Production Development Patterns

### Error Handling & Validation

```python
# Error handling pattern
try:
    input_data = await Actor.get_input()
    if not input_data or not input_data.get('start_urls'):
        raise ValueError('start_urls is required')
except Exception as error:
    await Actor.fail(f'Failed: {str(error)}')
```

- Early input validation
- Graceful error handling
- Structured error reporting

### Anti-Bot Protection

```python
# Anti-bot configuration
crawler = PlaywrightCrawler(
    browser_pool_options={
        'fingerprint_options': {
            'fingerprint_generator_options': {
                'browsers': [{'name': 'firefox', 'min_version': 80}],
                'devices': ['desktop'],
                'operating_systems': ['windows'],
            },
        },
    },
)
```

- Proxy configuration strategies
- Retry logic and backoff
- Session management

## Best Practices

### Actor Design

- UNIX philosophy: do one thing well
- Clear input/output schemas
- Comprehensive documentation
- Graceful error handling

### Performance & Production

- Proper concurrency and proxy configuration
- Retry strategies with exponential backoff
- Structured logging and monitoring

#### Performance Tuning Quick Wins

**Concurrency Configuration:**

HTTP Crawlers (BeautifulSoupCrawler):
```python
crawler = BeautifulSoupCrawler(
    min_concurrency=10,    # Start with 10 concurrent requests
    max_concurrency=50,    # Scale up to 50 for fast sites
    max_request_retries=3,  # Retry failed requests
    request_handler_timeout=30,
)
```

Browser Crawlers (PlaywrightCrawler):
```python
crawler = PlaywrightCrawler(
    min_concurrency=1,     # Start conservatively
    max_concurrency=5,     # Browsers are resource-intensive
    max_request_retries=2,
    request_handler_timeout=60,
)
```

**Retry and Backoff Strategies:**
```python
import asyncio
import math

async def recover_request_function(context):
    request = context.request
    error = context.error
    
    # Retry on specific errors
    if 'timeout' in str(error) or (hasattr(error, 'status_code') and error.status_code >= 500):
        request.retry_count = getattr(request, 'retry_count', 0) + 1
        
        # Exponential backoff
        delay = min(1000 * (2 ** request.retry_count), 10000) / 1000  # Convert to seconds
        await asyncio.sleep(delay)
        
        return request
    
    return None  # Don't retry

crawler = BeautifulSoupCrawler(
    max_request_retries=5,
    retry_on_blocked=True,
    recover_request_function=recover_request_function,
)
```

**Speed Optimization Tips:**
- **Cheerio is ~10x faster than browsers** - prefer it when possible
- **Use `max_requests_per_crawl`** to limit scope during development
- **Enable `keepAlive`** for HTTP connections when scraping the same domain
- **Optimize selectors** - use specific CSS selectors to avoid DOM traversal
- **Batch dataset writes** when processing many small items

### Data Quality

- Data validation and cleaning
- Fallback strategies for missing elements
- Semantic CSS selectors
- Handle edge cases and different formats

## Available MCP Tools

Use these tools to fetch detailed documentation and examples.

Note: This section applies only if an MCP server is configured in your environment. If MCP is not configured, print `@https://mcp.apify.com/`.

### Apify Documentation & Store Tools

- **search-apify-docs** - Search Apify documentation
- **fetch-apify-docs** - Get full documentation pages
- **search-actors** - Find existing Actors in the store
- **fetch-actor-details** - Get Actor specifications

### Actor Run Management Tools

- **get-actor-run** - Get detailed information about a specific Actor run
- **get-actor-run-list** - Get a list of an Actor's runs, filterable by status
- **get-actor-log** - Retrieve the logs for a specific Actor run

### Web Scraping and HTML Extraction

- **get-html-skeleton** - Retrieves the HTML skeleton (clean structure) from a given URL by stripping unwanted elements like scripts, styles, and non-essential attributes

### MCP Server Tools:

#### apify/rag-web-browser

Description: Web browser that can query Google Search, scrape the top N pages, and return their content as Markdown for further processing. Supports scraping individual URLs.

**Use for:**
- Google Search + scraping top results
- Individual URL scraping
- Converting web content to Markdown

#### mcp-servers/context7-mcp-server

Description: Context7 MCP server, which provides additional development resources and tools.

**Use for:**
- Development resources and documentation
- MCP-based integrations
- Library documentation access

These tools are available via your configured MCP server endpoint.

## Resources

- [docs.apify.com/llms.txt](https://docs.apify.com/llms.txt) 
- [docs.apify.com/llms-full.txt](https://docs.apify.com/llms-full.txt)
- [Actor Whitepaper](https://whitepaper.actor/) for complete specification
- [Crawlee Documentation](https://crawlee.dev) for web scraping

## Legal and Ethical Guardrails

### Compliance Guidelines

**Terms of Service (ToS):**
- Always review and respect website Terms of Service
- Check robots.txt files and honor crawl-delay directives
- Avoid scraping when explicitly prohibited

**Regional Compliance:**
- Respect GDPR, CCPA, and other data protection regulations
- Be aware of jurisdiction-specific scraping laws
- Consider data residency requirements

**Throttling and Rate Limiting:**
```python
import asyncio

async def delay_hook(context):
    await asyncio.sleep(1)  # 1s delay

crawler = BeautifulSoupCrawler(
    max_concurrency=1,           # Single request at a time
    request_handler_timeout=30,
    
    # Add delays between requests
    pre_navigation_hooks=[delay_hook],
)
```

**User Harm Minimization:**
- Implement reasonable request delays to avoid overloading servers
- Use appropriate concurrency limits
- Monitor and respect HTTP 429 (Too Many Requests) responses
- Consider the impact on website performance and user experience

**Best Practices:**
- Scrape only publicly available data
- Avoid personal or sensitive information unless explicitly permitted
- Implement proper error handling to fail gracefully
- Document your scraping methodology and limitations
- Consider reaching out to website owners for API access when available
