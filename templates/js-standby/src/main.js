import http from 'node:http';

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// import { router } from './routes.js';

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

// Create a simple HTTP server that will respond with a message
const server = http.createServer((req, res) => {
    // Handle Apify standby readiness probe
    // https://docs.apify.com/platform/actors/development/programming-interface/standby#readiness-probe
    if (req.headers['x-apify-container-server-readiness-probe']) {
        res.writeHead(200);
        res.end('ok');
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Actor Standby!\n');
});

// Listen on the standby port
server.listen(Actor.config.get('standbyPort'));
