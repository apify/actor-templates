// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, log } from 'apify';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
import { createApp } from './app.js';
import { getRunPool } from './run_pool.js';

// The init() call configures the Actor to correctly work with the Apify-provided environment - mainly the storage infrastructure. It is necessary that every Actor performs an init() call.
await Actor.init();

// Find out which users this run serves. See src/run_pool.ts for what each pool means for billing.
const pool = await getRunPool();
log.info(pool ? `This run serves the ${pool} pool` : 'This run was not started through the server interface');

const app = createApp({ pool, finishRun });

// Listen on the port the platform routes requests to (ACTOR_WEB_SERVER_PORT)
const port = Actor.config.get('containerPort');
const server = app.listen(port, (error) => {
    // Exit instead of staying up without a server, so the platform can start a new run.
    if (error) throw error;
    log.info(`Server is listening on port ${port}`);
});

// When the platform aborts the run, stop accepting requests. The SDK then exits the Actor by itself.
// Do not call Actor.exit() here: it waits for this handler to finish, so the Actor would exit 30 seconds late.
Actor.on('aborting', () => {
    server.close();
});

/**
 * Finishes the run with a success exit code. The app calls this when the spending limit of a single-tenant run
 * is reached. The server stops accepting requests and lets the ones in progress finish first.
 */
function finishRun() {
    server.close(() => {
        void Actor.exit('The run finished because its spending limit is reached.');
    });
}
