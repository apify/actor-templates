// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Include Apify SDK. For more information, see https://sdk.apify.com/
import { Actor } from 'apify';
import log from '@apify/log';

interface Schema {
    message?: string;
}

await Actor.init();

// Get input of the actor.
// If you'd like to have your input checked and have Apify display
// a user interface for it, add INPUT_SCHEMA.json file to your actor.
// For more information, see https://apify.com/docs/actor/input-schema

const input = await Actor.getInput<Schema>();
log.info('Input:', input);

// Do something useful here...
if (input?.message) {
    log.info(`Message is: ${input.message}`);
}

// Save output
const output = {
    receivedInput: input,
    message: 'Hello sir!',
};
log.info('Output:', output);
await Actor.setValue('OUTPUT', output);

await Actor.exit();
