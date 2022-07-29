// This is the main Node.js source code file of your actor.

// Import Apify SDK. For more information, see https://sdk.apify.com/
const { Actor } = require('apify');

Actor.main(async () => {
    // Get input of the actor (here only for demonstration purposes).
    const input = await Actor.getInput();
    console.log('Input:');
    console.dir(input);

    /**
     * Actor code
     */
});
