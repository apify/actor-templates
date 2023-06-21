# Empty TypeScript Actor template

Start a new web scraping project quickly and easily in TypeScript (Node.js) with our empty project template. It provides a basic structure for the Actor with [Apify SDK](https://docs.apify.com/sdk/js/) and allows you to easily add your own functionality.

## Included features
- **[Apify SDK](https://docs.apify.com/sdk/js/)** - a toolkit for building actors
- **[Crawlee](https://crawlee.dev)** - web scraping and browser automation library

## How it works
Insert your own code between `await Actor.init()` and `await Actor.exit()`. If you would like to use the [Crawlee](https://crawlee.dev) library simply uncomment its import `import { CheerioCrawler } from 'crawlee';`.
