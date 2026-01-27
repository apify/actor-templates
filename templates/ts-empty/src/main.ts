// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, log } from 'apify';
// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
// import { CheerioCrawler } from '@crawlee/cheerio';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
// import { router } from './routes.js';

// The init() call configures the Actor to correctly work with the Apify-provided environment - mainly the storage infrastructure. It is necessary that every Actor performs an init() call.
await Actor.init();

log.info('Hello from the Actor!');
/**
 * Actor code
 */

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
