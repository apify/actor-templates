// This is the main Node.js source code file of your Actor.
// An Actor is a program that takes an input and produces an output.

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from "apify";
//  Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
// import { CheerioCrawler } from 'crawlee';

// Initialize the Apify SDK
// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

console.log('Hello from the Actor!');
/**
 * Actor code
 */

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
