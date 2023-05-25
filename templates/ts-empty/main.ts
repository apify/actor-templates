// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from "apify";
//  Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
// import { CheerioCrawler } from 'crawlee';

// Initialize the Apify SDK
await Actor.init();

console.log('Hello from the Actor!');
/**
 * Actor code
 */

// Exit successfully
await Actor.exit();
