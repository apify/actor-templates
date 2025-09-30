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

### Apify JavaScript SDK (`apify`)

```javascript
// Main class: Actor
import { Actor } from 'apify';
// Key methods: init, getInput, pushData, setValue, exit
```

- Purpose: Building Actors that run ON the Apify platform
- Use for: Actor logic that runs on Apify platform

### Apify JavaScript Client (`apify-client`)

```javascript
// Main class: ApifyClient
import { ApifyClient } from 'apify-client';
const client = new ApifyClient({ token: 'your-token' });
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
    - `main.ts`: Actor entry point and orchestrator.
- `Dockerfile`: Container image definition used to build and run the Actor locally and on the Apify platform.
- `AGENTS.md`: Project-specific AI agent rules and instructions. Any AI agent working in this repository must follow the instructions in this file at all times.
- `storage/`: Local storage (mirrors Apify platform storages during local runs)
    - `datasets/`: Stores output items (each item is a JSON object produced by the Actor).
    - `key_value_stores/`: Key–value storage. The default store contains `INPUT` (the Actor’s input).
    - `request_queues/`: Persistent queues of pending requests used for crawling and automation flows.

## Storage Systems

Actors provide three storage types:

### Dataset - Structured Results

```javascript
// Key methods: Actor.pushData(), Dataset.pushData()
await Actor.pushData(data);
const dataset = await Dataset.open('name');
await dataset.exportToCSV('./results.csv');
```

- Append-only storage for scraping results
- Like a database table for collected data
- Supports JSON, CSV export formats

### Key-Value Store - Files & Configuration

```javascript
// Key methods: Actor.setValue(), Actor.getValue(), KeyValueStore
await Actor.setValue(key, value);
const data = await Actor.getValue(key);
const store = await KeyValueStore.open();
```

- Store objects, files, and configuration
- Auto JSON serialization for objects
- Support for binary data with content types

### Request Queue - URLs to Crawl

```javascript
// Key class: RequestQueue
const queue = await RequestQueue.open();
await queue.addRequest({ url, userData });
```

- Managed by crawling libraries (Crawlee)
- Handles deduplication and retry logic
- Supports breadth-first and depth-first crawling

## Crawlee - Web Scraping Framework

Crawlee is a powerful web scraping and browser automation library that makes building reliable crawlers fast and efficient.

Note: Only apply the guidance in this section if the `crawlee` package is installed (i.e., listed in `package.json`). In addition, the agent should check which tools are actually used in this project and follow only the relevant parts:

- If using Cheerio-based flows (e.g., `CheerioCrawler` or standalone `cheerio`), apply the Cheerio guidance.
- If using real browsers (e.g., `PlaywrightCrawler` or `playwright`), apply the Playwright guidance.
- If using other Crawlee crawlers (e.g., `PuppeteerCrawler`, `JSDOMCrawler`), apply only those relevant sections.

If `crawlee` is not installed or the corresponding tool is not used, ignore the related guidance.

### Version Compatibility Notes

**Crawlee 3.x + Apify SDK 3.x Compatibility:**
- `CheerioCrawler` doesn't support `requestHandlerTimeoutMillis` or `additionalHttpHeaders`
- Use `preNavigationHooks` for setting headers instead of deprecated options
- Prefer `preNavigationHooks` or `sendRequest` overrides to set headers/cookies on HTTP crawlers
- Some option names have changed between versions - check current documentation for exact API

### CheerioCrawler (HTTP + HTML Parsing)

```javascript
// Class: CheerioCrawler
const crawler = new CheerioCrawler({
    async requestHandler({ $, request, enqueueLinks }) {
        // jQuery-like selector access via $
    }
});
```

- Best for: Static HTML content, Server-rendered content, fastest option (~10x faster than browsers)
- Use cases: E-commerce sites, news sites, listings, server-rendered content
- Performance: Can scrape 500+ pages per minute with 4GB memory

#### Anti-Bot Protection for HTTP Crawling

Before switching to browsers, try these "HTTP-first" mitigation patterns:

```javascript
const crawler = new CheerioCrawler({
  preNavigationHooks: [async ({ request }) => {
    request.headers = {
      ...request.headers,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'cs,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    };
  }],
});
```

**Key strategies:**
- **Stable headers**: Use consistent, realistic browser headers
- **Locale stabilization**: Set `Accept-Language: en`, or any other relevant language
- **Cookie consent handling**: Selectively preserve or strip cookies via `sendRequest`/`cookieJar`
- **Request timing**: Add delays between requests to avoid rate limiting

### PlaywrightCrawler (Real Browser)

```javascript
// Class: PlaywrightCrawler
const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, enqueueLinks }) {
        // Full browser page access
    }
});
```

- Best for: JavaScript-heavy sites, dynamic content, modern SPAs
- Use cases: Social media, modern web apps, complex interactions and authentication, sites requiring JavaScript rendering

### AdaptiveCrawler (Smart Switching)

```javascript
// Class: AdaptivePlaywrightCrawler
const crawler = new AdaptivePlaywrightCrawler({
    renderingTypeDetectionRatio: 0.1
});
```

- Automatically decides: whether to use HTTP or browser based on content analysis
- Best for: Mixed content sites where some pages need JS, others don't

### Key Crawlee Features

#### Request Queue & State Management

```javascript
// Classes: RequestQueue, KeyValueStore
const requestQueue = await RequestQueue.open();
const store = await KeyValueStore.open();
```

- Persistent queues that survive restarts
- State management with key-value storage
- Custom request routing and labeling

#### Proxy Configuration & Anti-Bot Protection

```javascript
// Class: ProxyConfiguration
const proxyConfiguration = new ProxyConfiguration({
    groups: ['RESIDENTIAL', 'DATACENTER']
});
```

- Built-in proxy rotation support
- Anti-bot protection with fingerprinting
- Session management for consistent crawling

#### Router Pattern for Complex Crawls

```javascript
// Functions: createCheerioRouter, createPlaywrightRouter
const router = createCheerioRouter();
router.addHandler('PRODUCT', async ({ $, request }) => {});
```

- Handle different page types with dedicated handlers
- Clean separation of scraping logic
- Scalable architecture for large projects

#### Cheerio Router Pattern Example

```javascript
import { createCheerioRouter, CheerioCrawler } from 'crawlee';

const router = createCheerioRouter();

// Category page handler
router.addHandler('CATEGORY', async ({ $, request, enqueueLinks }) => {
    // Enqueue product detail pages
    await enqueueLinks({
        selector: '.product-item a',
        label: 'PRODUCT',
    });
    
    // Handle pagination
    await enqueueLinks({
        selector: '.pagination .next',
        label: 'CATEGORY',
    });
});

// Product detail handler
router.addHandler('PRODUCT', async ({ $, request }) => {
    const product = {
        url: request.loadedUrl,
        title: $('h1.product-title').text()?.trim() || null,
        price: parsePrice($('.price').text()),
        images: $('.product-images img').map((_, el) => $(el).attr('src')).get(),
        description: $('.product-description').text()?.trim() || null,
        availability: $('.availability').text()?.includes('skladem') ? 'in_stock' : 'out_of_stock',
    };
    
    // Clean empty fields
    const cleanProduct = Object.fromEntries(
        Object.entries(product).filter(([_, value]) => value !== null && value !== '')
    );
    
    await Actor.pushData(cleanProduct);
});

function parsePrice(priceText) {
    const match = priceText?.match(/(\d+(?:\s?\d+)*)[,.]?(\d{0,2})/);
    return match ? parseFloat(match[0].replace(/\s/g, '').replace(',', '.')) : null;
}
```

## Apify Proxy Integration

```javascript
// Method: Actor.createProxyConfiguration
const proxyConfig = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
    countryCode: 'US'
});
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

```javascript
import { Actor } from 'apify';

await Actor.init();

const mysqlUser = process.env.MYSQL_USER;
console.log(mysqlUser);

await Actor.exit();
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
    "startUrls": {
      "title": "Start URLs",
      "type": "array",
      "description": "URLs to start scraping from (category pages or product pages)",
      "editor": "requestListSources",
      "default": [{"url": "https://example.com/category"}],
      "prefill": [{"url": "https://example.com/category"}]
    },
    "followVariants": {
      "title": "Follow Product Variants",
      "type": "boolean",
      "description": "Whether to scrape product variants (different colors, sizes)",
      "default": true
    },
    "maxRequestsPerCrawl": {
      "title": "Max Requests per Crawl",
      "type": "integer",
      "description": "Maximum number of pages to scrape (0 = unlimited)",
      "default": 1000,
      "minimum": 0
    },
    "proxyConfiguration": {
      "title": "Proxy Configuration",
      "type": "object",
      "description": "Proxy settings for anti-bot protection",
      "editor": "proxy",
      "default": {"useApifyProxy": false}
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
  "required": ["startUrls"]
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

```javascript
// Status methods
await Actor.setStatusMessage('Processing page 1/100');
await Actor.exit('Successfully completed');
await Actor.fail('Error: Invalid input');
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

```javascript
// Charging method
await Actor.charge({
    eventName: 'api-call'
});
```

## Production Development Patterns

### Error Handling & Validation

```javascript
// Error handling pattern
try {
    const input = await Actor.getInput();
    if (!input?.startUrls?.length) {
        throw new Error('startUrls is required');
    }
} catch (error) {
    await Actor.fail(`Failed: ${error.message}`);
}
```

- Early input validation
- Graceful error handling
- Structured error reporting

### Anti-Bot Protection

```javascript
// Anti-bot configuration
const crawler = new PlaywrightCrawler({
    browserPoolOptions: {
        fingerprintOptions: {
            fingerprintGeneratorOptions: {
                browsers: [{ name: 'firefox', minVersion: 80 }],
                devices: ['desktop'],
                operatingSystems: ['windows'],
            },
        },
    },
});
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

HTTP Crawlers (CheerioCrawler):
```javascript
const crawler = new CheerioCrawler({
    minConcurrency: 10,    // Start with 10 concurrent requests
    maxConcurrency: 50,    // Scale up to 50 for fast sites
    maxRequestRetries: 3,  // Retry failed requests
    requestHandlerTimeoutSecs: 30,
});
```

Browser Crawlers (PlaywrightCrawler):
```javascript
const crawler = new PlaywrightCrawler({
    minConcurrency: 1,     // Start conservatively
    maxConcurrency: 5,     // Browsers are resource-intensive
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 60,
});
```

**Retry and Backoff Strategies:**
```javascript
const crawler = new CheerioCrawler({
    maxRequestRetries: 5,
    retryOnBlocked: true,
    
    // Custom retry condition
    recoverRequestFunction: async ({ request, error }) => {
        // Retry on specific errors
        if (error.message.includes('timeout') || error.statusCode >= 500) {
            request.retryCount = (request.retryCount || 0) + 1;
            
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, request.retryCount), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return request;
        }
        
        return null; // Don't retry
    }
});
```

**Speed Optimization Tips:**
- **Cheerio is ~10x faster than browsers** - prefer it when possible
- **Use `maxRequestsPerCrawl`** to limit scope during development
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
```javascript
const crawler = new CheerioCrawler({
    maxConcurrency: 1,           // Single request at a time
    requestHandlerTimeoutSecs: 30,
    
    // Add delays between requests
    preNavigationHooks: [async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
    }],
});
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
