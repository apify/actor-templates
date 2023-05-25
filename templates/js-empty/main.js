// This is the main Node.js source code file of your Actor.
// An Actor is a program that takes an input and produces an output.

// Import Apify SDK (Read more at https://docs.apify.com/sdk/js)
import { Actor } from 'apify';

// Initialize the Apify SDK
await Actor.init();

console.log('Hello from the Actor!');
/**
 * Actor code
 */

// Exit successfully
await Actor.exit();
