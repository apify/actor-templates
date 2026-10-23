import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { MCPClient } from '@mastra/mcp';
import { Actor, log } from 'apify';

import { loadAgentPackage } from './package.ts';
import { apifyPlatform } from './platform.ts';
import { runAgent } from './run.ts';

await Actor.init();

const input = ((await Actor.getInput()) ?? {}) as Record<string, unknown>;
const pkg = await loadAgentPackage(process.cwd());
const token = process.env.APIFY_TOKEN;

// LLM calls are billed to the user who runs the Actor, through a gateway Actor and the run token.
// Today that is apify/openrouter; the planned Apify AI Gateway (Bedrock) would replace the URL.
const gateway = createOpenAICompatible({
    name: 'apify-llm-gateway',
    baseURL: process.env.LLM_GATEWAY_URL ?? 'https://openrouter.apify.actor/api/v1',
    headers: { Authorization: `Bearer ${token}` },
    includeUsage: true,
});

// Apify MCP for reading Actor docs when an input fails. Running Actors goes through `run_actor`,
// which enforces the allowlist and the budget, so `call-actor` is not served.
const mcpTools = pkg.config.actors.allowDiscovery ? 'search-actors,fetch-actor-details' : 'fetch-actor-details';
const mcp = new MCPClient({
    servers: {
        apify: {
            url: new URL(`https://mcp.apify.com/?tools=${mcpTools}`),
            requestInit: { headers: { Authorization: `Bearer ${token}` } },
        },
    },
});
const { tools: extraTools, errors } = await mcp.listToolsWithErrors();
if (Object.keys(errors).length) log.warning('Apify MCP is not available; continuing without it.', { errors });

const report = await runAgent({
    pkg,
    input,
    model: gateway(pkg.config.model.id),
    platform: apifyPlatform,
    workDir: await mkdtemp(path.join(os.tmpdir(), 'agent-')),
    extraTools,
    log: (message) => log.info(message),
});
await mcp.disconnect();

await Actor.setValue('AGENT_TRACE.json', report);
log.info('Agent finished', { stopReason: report.stopReason, steps: report.steps, budget: report.budget });

if (report.status === 'failed') await Actor.fail(report.summary.slice(0, 1000));
else await Actor.exit({ statusMessage: report.summary.slice(0, 1000) });
