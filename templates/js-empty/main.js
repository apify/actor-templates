// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.

// For more information, see https://sdk.apify.com
import { Actor } from 'apify';
// For more information, see https://crawlee.dev
// import { CheerioCrawler } from 'crawlee';

// Initialize the Apify SDK
await Actor.init();

// Get input of the actor (here only for demonstration purposes).
const input = await Actor.getInput();
console.log('Input:');
console.dir(input);

/**
 * Actor code
 */


// Exit successfully
await Actor.exit();
