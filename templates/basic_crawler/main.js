// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require('apify');

Apify.main(async () => {
    // Get input of the actor (here only for demonstration purposes).
    // If you'd like to have your input checked and have Apify display
    // a user interface for it, add INPUT_SCHEMA.json file to your actor.
    // For more information, see https://apify.com/docs/actor/input-schema
    const input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    if (!input || !input.sources) throw new Error('Input must be a JSON object with the "sources" field!');

    const requestList = await Apify.openRequestList('my-request-list', input.sources);

    // Create a basic crawler that will use request-promise to download
    // web pages from a given list of URLs
    const basicCrawler = new Apify.BasicCrawler({
        requestList,
        handleRequestFunction: async ({ request }) => {
            const { body } = await Apify.utils.requestAsBrowser({url: request.url});
            await Apify.pushData({
                request,
                finishedAt: new Date(),
                html: body,
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },

        handleFailedRequestFunction: async ({ request }) => {
            await Apify.pushData({
                '#isFailed': true,
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
    });

    await basicCrawler.run();
});
