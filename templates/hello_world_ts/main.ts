// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Include Apify SDK. For more information, see https://sdk.apify.com/
import Apify from 'apify';

const { log } = Apify.utils;

interface Schema {
    message?: string;
}

Apify.main(async () => {
    // Get input of the actor.
    // If you'd like to have your input checked and have Apify display
    // a user interface for it, add INPUT_SCHEMA.json file to your actor.
    // For more information, see https://apify.com/docs/actor/input-schema
    const input: Schema = await Apify.getInput();
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
    await Apify.setValue('OUTPUT', output);
});
