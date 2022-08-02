// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// For more information, see https://crawlee.dev
import { Actor } from 'apify';

await Actor.init();

// Get input of the actor.
// If you'd like to have your input checked and have Apify display
// a user interface for it, add INPUT_SCHEMA.json file to your actor.
// For more information, see https://docs.apify.com/actors/development/input-schema
const input = await Actor.getInput();
console.log('Input:');
console.dir(input);

// Do something useful here...

// Save output
const output = {
    receivedInput: input,
    message: 'Hello sir!',
};
console.log('Output:');
console.dir(output);
await Actor.setValue('OUTPUT', output);

await Actor.exit();
