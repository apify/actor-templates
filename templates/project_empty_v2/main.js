// This is the main Node.js source code file of your actor.

// Import Apify SDK v2. For more information, see https://sdk.apify.com/
const Apify = require('apify');

Apify.main(async () => {
    // Get input of the actor (here only for demonstration purposes).
    const input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    /**
     * Actor code
     */
});
