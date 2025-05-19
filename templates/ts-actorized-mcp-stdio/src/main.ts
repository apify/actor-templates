/**
 * ArXiv MCP Server - Main Entry Point
 *
 * This file serves as the entry point for the ArXiv MCP Server Actor.
 * It sets up a proxy server that forwards requests to the locally running
 * ArXiv MCP server, which provides a Model Context Protocol (MCP) interface
 * for AI assistants to search and access arXiv papers.
 */

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';
import { stdioToSse } from './lib/server.js';
import { getLogger } from './lib/getLogger.js';

// This is an ESM project, and as such, it requires you to specify extensions in your relative imports
// Read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// Note that we need to use `.js` even when inside TS files
// import { router } from './routes.js';

// Configuration constants for the MCP server
// Command to run the ArXiv MCP server using uv package manager
// TODO: Do not forget to install the MCP server in the Dockerfile
const MCP_COMMAND = 'uv tool run arxiv-mcp-server';

// Check if the Actor is running in standby mode
const STANDBY_MODE = Actor.getEnv().metaOrigin === 'STANDBY';

// Logger configuration
const LOG_LEVEL = 'info';
const OUTPUT_TRANSPORT = 'sse';

// Initialize the Apify Actor environment
// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

// Charge for Actor start
await Actor.charge({ eventName: 'actor-start' });

if (!STANDBY_MODE) {
    // If the Actor is not in standby mode, we should not run the MCP server
    await Actor.fail('This actor is not meant to be run directly. It should be run in standby mode.');
}

const logger = getLogger({
    logLevel: LOG_LEVEL,
    outputTransport: OUTPUT_TRANSPORT,
});
await stdioToSse({
    port: Actor.config.get('standbyPort'),
    stdioCmd: MCP_COMMAND,
    logger,
});
