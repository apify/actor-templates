// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, log } from 'apify';
import { createSocialMediaAgent } from './agents.js';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
// import { router } from './routes.js';

// Actor input schema
interface Input {
    query: string;
    modelName: string;
}


// Skip the Actor execution if running in test mode
// You can remove this block. It is only used for Apify template testing.
if (process.env.NODE_ENV === 'test') {
    console.log('Running in test mode. Skipping the Actor execution.');
    process.exit(0);
}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

/**
 * Actor code
*/

// Charge for Actor start
await Actor.charge({ eventName: 'actor-start' });

// Handle input
const {
    // The query default value is provided only for template testing purposes.
    // You can remove it.
    query,
    modelName,
} = await Actor.getInput() as Input;
if (!query) {
    throw new Error('An agent query is required.');
}

// Create the social media agent with tools
const agent = createSocialMediaAgent(modelName);

log.info(`Querying the agent with the following query: ${query}`);

// Query the agent and get the response
const response = await agent.generate([
    { role: 'user', content: query },
]);

log.info(`Agent response: ${response.text}`);

// Charge for the task completion
await Actor.charge({ eventName: 'task-completed' });

// Push results into the dataset
await Actor.pushData({
    query,
    response: response.text,
});

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
