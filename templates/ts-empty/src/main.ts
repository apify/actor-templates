// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, log } from 'apify';

// The init() call configures the Actor to correctly work with the Apify-provided environment - mainly the storage infrastructure. It is necessary that every Actor performs an init() call.
await Actor.init();

log.info('Hello from the Actor!');
/**
 * Actor code
 */

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
