// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// For more information, see https://crawlee.dev
import { Actor } from 'apify';
import { launchPuppeteer } from 'crawlee';

await Actor.init();

// Get input of the actor (here only for demonstration purposes).
// If you'd like to have your input checked and have Apify display
// a user interface for it, add INPUT_SCHEMA.json file to your actor.
// For more information, see https://docs.apify.com/actors/development/input-schema
const input = await Actor.getInput();
console.log('Input:');
console.dir(input);

if (!input || !input.url) throw new Error('Input must be a JSON object with the "url" field!');

console.log('Launching Puppeteer...');
const browser = await launchPuppeteer();

console.log(`Opening page ${input.url}...`);
const page = await browser.newPage();
await page.goto(input.url);
const title = await page.title();
console.log(`Title of the page "${input.url}" is "${title}".`);

console.log('Saving output...');
await Actor.setValue('OUTPUT', {
    title,
});

console.log('Closing Puppeteer...');
await browser.close();

console.log('Done.');
await Actor.exit();
