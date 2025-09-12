# Apify Actors Development Guide

**High-level conceptual guide for building serverless web scraping and automation tools using the Actor programming model.**

⚠️ **CRITICAL:** This guide provides conceptual overviews only. For detailed code examples, implementation specifics, and API documentation, **use the available tools listed at the end**. The tools will fetch current, accurate documentation automatically.

## What are Actors?

**Actors are serverless programs that run in the cloud.** 
They're inspired by the UNIX philosophy - programs that do one thing well and can be easily combined to build complex systems.

**Core Concept:** Actors are programs packaged as Docker images that:
- Accept well-defined JSON input
- Perform isolated tasks (web scraping, automation, data processing)
- Produce structured JSON output
- Can run from seconds to hours or even indefinitely
- Persist state and can be restarted

## Storage Systems

**Actors provide three storage types:**

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

## Quick Setup Overview

```bash
# Basic CLI commands
apify login
apify create my-actor
apify run
apify push
```

Basic workflow: Install CLI → Login → Create Actor → Run locally → Deploy

## Actor Development Workflow

### Project Structure
Standard Actor project includes:
- `.actor/` directory with configuration files
- `src/` directory for main logic
- Input/output schemas for validation
- Dockerfile for containerization

### Key Configuration Files
- `actor.json` - Actor metadata and settings
- `input_schema.json` - Input validation rules
- `output_schema.json` - Output structure definition

### Basic Actor Lifecycle
```javascript
// Core Actor methods
await Actor.init();
const input = await Actor.getInput();
await Actor.setStatusMessage('Processing...');
await Actor.exit('Completed successfully');
```

# Crawlee - Web Scraping Framework

**Crawlee is a powerful web scraping and browser automation library that makes building reliable crawlers fast and efficient.**

## Main Crawler Types

### CheerioCrawler (HTTP + HTML Parsing)
```javascript
// Class: CheerioCrawler
const crawler = new CheerioCrawler({
    async requestHandler({ $, request, enqueueLinks }) {
        // jQuery-like selector access via $
    }
});
```
- **Best for:** Static HTML content, fastest option (~10x faster than browsers)
- **Use cases:** E-commerce sites, news sites, listings, server-rendered content
- **Performance:** Can scrape 500+ pages per minute with 4GB memory

### PlaywrightCrawler (Real Browser)
```javascript
// Class: PlaywrightCrawler
const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, enqueueLinks }) {
        // Full browser page access
    }
});
```
- **Best for:** JavaScript-heavy sites, dynamic content, modern SPAs
- **Use cases:** Social media, modern web apps, sites requiring JavaScript rendering

### AdaptiveCrawler (Smart Switching)
```javascript
// Class: AdaptivePlaywrightCrawler
const crawler = new AdaptivePlaywrightCrawler({
    renderingTypeDetectionRatio: 0.1
});
```
- **Automatically decides** whether to use HTTP or browser based on content analysis
- **Best for:** Mixed content sites where some pages need JS, others don't

## Key Crawlee Features

### Request Queue & State Management
```javascript
// Classes: RequestQueue, KeyValueStore
const requestQueue = await RequestQueue.open();
const store = await KeyValueStore.open();
```
- Persistent queues that survive restarts
- State management with key-value storage
- Custom request routing and labeling

### Proxy Configuration & Anti-Bot Protection
```javascript
// Class: ProxyConfiguration
const proxyConfiguration = new ProxyConfiguration({
    groups: ['RESIDENTIAL', 'DATACENTER']
});
```
- Built-in proxy rotation support
- Anti-bot protection with fingerprinting
- Session management for consistent crawling

### Router Pattern for Complex Crawls
```javascript
// Functions: createCheerioRouter, createPlaywrightRouter
const router = createCheerioRouter();
router.addHandler('PRODUCT', async ({ $, request }) => {});
```
- Handle different page types with dedicated handlers
- Clean separation of scraping logic
- Scalable architecture for large projects

### Storage & Data Export
```javascript
// Classes: Dataset, KeyValueStore
await dataset.exportToCSV('./results.csv');
await dataset.exportToJSON('./results.json');
```
- Multiple output formats (CSV, JSON, etc.)
- Automatic data serialization
- Built-in export capabilities

## Integration with Apify Platform

### Running on Apify Cloud
```javascript
// Integration methods
await Actor.init();
const input = await Actor.getInput();
await Actor.pushData(data);
await Actor.exit();
```
- Seamless integration with Actor lifecycle
- Automatic storage management
- Built-in proxy and infrastructure support

### Apify Proxy Integration
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

## Web Scraping Decision Framework

### When to Use Each Approach:

**CheerioCrawler (Static HTML):** 
- Server-rendered content, fastest option
- E-commerce, news sites, listings
- Simple HTML parsing requirements

**PlaywrightCrawler (Browser Automation):**
- JavaScript-heavy sites, dynamic content
- Social media, modern web apps, SPAs
- Complex interactions and authentication

**AdaptiveCrawler:**
- Mixed content sites
- Automatic optimization based on content analysis

**API Scraping:**
- Direct data access, most reliable
- Check DevTools Network tab for endpoints
- Less prone to breaking, structured data

## Key Apify Libraries

### 1. Apify CLI (`apify-cli`)
```bash
# Key commands
apify create, apify run, apify push, apify login
```
- **Purpose:** Development workflow and deployment tool
- **Use for:** Local development, testing, and deployment

### 2. Apify JavaScript SDK (`apify`)
```javascript
// Main class: Actor
import { Actor } from 'apify';
// Key methods: init, getInput, pushData, setValue, exit
```
- **Purpose:** Building Actors that run ON the Apify platform
- **Use for:** Actor logic that runs on Apify platform

### 3. Apify JavaScript Client (`apify-client`)
```javascript
// Main class: ApifyClient
import { ApifyClient } from 'apify-client';
const client = new ApifyClient({ token: 'your-token' });
```
- **Purpose:** Calling Apify API from external applications
- **Use for:** External apps, webhooks, orchestration systems

**Key Distinction:** SDK is for code RUNNING on Apify, Client is for code CALLING Apify.

## Environment Variables

Key environment variables available to Actors:
```bash
ACTOR_ID, ACTOR_RUN_ID, ACTOR_INPUT_KEY
ACTOR_MEMORY_MBYTES, ACTOR_DEFAULT_DATASET_ID
ACTOR_WEB_SERVER_PORT, ACTOR_WEB_SERVER_URL
```
- Actor identification (ID, RUN_ID)
- Resource allocation (memory, storage IDs)
- Network configuration (ports, URLs)

## Actor Status & Lifecycle

**Run States:** READY → RUNNING → SUCCEEDED/FAILED/ABORTED/TIMED-OUT

**Status Management:**
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

### Deployment Options
```bash
# Deployment workflow
apify create → apify run → apify push
```
- Local development to cloud deployment workflow
- Automated build and deployment process

### Monetization Models
```javascript
// Charging method
await Actor.charge({
    eventName: 'api-call',
    count: 100,
    chargePerEventUsd: 0.01
});
```
- Usage-based pricing (compute + storage)
- Pay-per-event custom pricing
- Fixed pricing tiers
- Open source rewards program

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
    proxyConfiguration,
    fingerprintOptions: { /* ... */ },
    useSessionPool: true
});
```
- Proxy configuration strategies
- Retry logic and backoff
- Session management

## Best Practices

**Actor Design:**
- UNIX philosophy: do one thing well
- Clear input/output schemas
- Comprehensive documentation
- Graceful error handling

**Performance & Production:**
- Choose appropriate tools for content type
- Proper concurrency and proxy configuration
- Retry strategies with exponential backoff
- Structured logging and monitoring

**Data Quality:**
- Data validation and cleaning
- Fallback strategies for missing elements
- Semantic CSS selectors
- Handle edge cases and different formats

## Available Tools

Use these tools to fetch detailed documentation and examples:

### Apify Documentation & Store Tools:
- **search-apify-docs** - Search Apify documentation
- **fetch-apify-docs** - Get full documentation pages  
- **search-actors** - Find existing Actors in the store
- **fetch-actor-details** - Get Actor specifications

### Actor Run Management Tools:
- **get-actor-run** - Get detailed information about a specific Actor run
- **get-actor-run-list** - Get a list of an Actor's runs, filterable by status
- **get-actor-log** - Retrieve the logs for a specific Actor run

### MCP Server Tools:

#### apify/rag-web-browser
**Description:** Web browser that can query Google Search, scrape the top N pages, and return their content as Markdown for further processing. Supports scraping individual URLs.

**Use for:**
- Google Search + scraping top results
- Individual URL scraping 
- Converting web content to Markdown

#### mcp-servers/context7-mcp-server  
**Description:** Context7 MCP server, which provides additional development resources and tools.

**Use for:**
- Development resources and documentation
- MCP-based integrations
- Library documentation access

These tools are available via your configured MCP server endpoint.

## Context7 MCP Integration Rule

**AUTOMATIC CONTEXT7 USAGE:** Always use Context7 MCP tools when I need:
- Code generation or examples
- Setup or configuration steps  
- Library/API documentation
- Implementation guidance

**Do NOT wait for explicit requests** - automatically resolve library documentation using Context7 MCP tools for these specific Apify libraries:

### Primary Apify Libraries:
- `/apify/crawlee` - Main Crawlee web scraping framework
- `/crawlee.dev/js/docs` - Official Crawlee documentation
- `/apify/apify-sdk-js` - Apify JavaScript SDK for Actor development
- `/apify/apify-client-js` - Apify Client for external API integration

## Resources

- Use `search-apify-docs` for specific documentation
- Browse existing Actors with `search-actors`
- [Apify Store](https://apify.com/store) for inspiration
- [Actor Whitepaper](https://whitepaper.actor/) for complete specification
- [Crawlee Documentation](https://crawlee.dev) for web scraping

**Remember:** This guide provides conceptual foundation only. Use the available tools to fetch specific implementation details, code examples, and current documentation as needed.
