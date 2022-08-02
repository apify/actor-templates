// This is the main Node.js source code file of your actor.

// For more information, see https://crawlee.dev
import { Actor } from 'apify';
// import { CheerioCrawler } from 'crawlee';

// Initialize the Apify SDK
await Actor.init();

// If we want to use `@apify/storage-local` instead of the default `@crawlee/memory-storage`,
// we need to first install it via `npm i -D @apify/storage-local@^2.1.0` and provide it
// via `Actor.init` explicitly:
//
// import { ApifyStorageLocal } from '@apify/storage-local';
// const storage = new ApifyStorageLocal();
// await Actor.init({ storage });

// Get input of the actor (here only for demonstration purposes).
const input = await Actor.getInput();
console.log('Input:');
console.dir(input);

/**
 * Actor code
 */


// Exit successfully
await Actor.exit();
