import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createTool } from '@mastra/core/tools';
import { Ajv } from 'ajv';
import { z } from 'zod';

import type { Budget } from './budget.ts';
import type { AgentConfig } from './package.ts';
import type { Platform } from './platform.ts';

export type RunState = {
    finished?: { status: 'succeeded' | 'failed'; summary: string };
    pushedItems: number;
    actorRuns: { actor: string; runId: string; status: string; costUsd: number; items: number }[];
};

type ToolDeps = {
    platform: Platform;
    budget: Budget;
    config: AgentConfig;
    workDir: string;
    state: RunState;
    datasetItemSchema?: Record<string, unknown>;
};

/** Resolves a path the model gave relative to the work directory and refuses to leave it. */
export function resolveInside(workDir: string, relativePath: string): string {
    const resolved = path.resolve(workDir, relativePath);
    if (resolved !== workDir && !resolved.startsWith(`${workDir}${path.sep}`)) {
        throw new Error(`Path "${relativePath}" is outside the work directory.`);
    }
    return resolved;
}

function sampleFields(items: unknown[]): string[] {
    const first = items.find((item) => item && typeof item === 'object');
    return first ? Object.keys(first).slice(0, 30) : [];
}

export function createRuntimeTools({ platform, budget, config, workDir, state, datasetItemSchema }: ToolDeps) {
    const validateItem = datasetItemSchema
        ? new Ajv({ allErrors: true, strict: false }).compile(datasetItemSchema)
        : undefined;

    const runActor = createTool({
        id: 'run_actor',
        description:
            'Runs an Apify Actor, waits for it to finish and saves its dataset items as a JSON array to ' +
            '`data/raw/<saveAs>.json`. Returns the item count, the fields of the first item and the cost, not the ' +
            'items: read or process the file with scripts. Only the Actors listed in the instructions can be run.',
        inputSchema: z.object({
            actor: z.string().describe('Actor name, "username/actor-name".'),
            input: z.record(z.string(), z.unknown()).describe('Actor input, as documented in the skill.'),
            saveAs: z
                .string()
                .regex(/^[a-z0-9][a-z0-9-]*$/)
                .describe('File name without extension, e.g. "instagram" or "instagram-profiles".'),
            maxItems: z.number().int().positive().max(1000).default(100),
        }),
        execute: async ({ actor, input, saveAs, maxItems }) => {
            if (!config.actors.allowDiscovery && !config.actors.allow.includes(actor)) {
                return { error: `Actor "${actor}" is not allowed. Allowed: ${config.actors.allow.join(', ')}.` };
            }
            const minimumUsd = await platform.minimalChargeUsd(actor);
            const reservedUsd = budget.reserve(config.limits.maxActorRunBudgetUsd, minimumUsd);
            if (reservedUsd < 0.01) {
                return {
                    error:
                        `Not enough budget for ${actor}: a run needs at least $${Math.max(minimumUsd, 0.01).toFixed(2)}, ` +
                        `$${budget.remainingUsd().toFixed(2)} is left. Finish with what you have.`,
                };
            }
            try {
                const run = await platform.runActor(actor, input, {
                    maxTotalChargeUsd: reservedUsd,
                    timeoutSecs: 600,
                    maxItems,
                });
                budget.settle(reservedUsd, run.costUsd);
                const file = `data/raw/${saveAs}.json`;
                await mkdir(path.join(workDir, 'data', 'raw'), { recursive: true });
                await writeFile(resolveInside(workDir, file), JSON.stringify(run.items));
                state.actorRuns.push({ actor, runId: run.runId, status: run.status, costUsd: run.costUsd, items: run.items.length });
                return {
                    runId: run.runId,
                    status: run.status,
                    statusMessage: run.statusMessage,
                    itemCount: run.items.length,
                    fields: sampleFields(run.items),
                    file,
                    costUsd: run.costUsd,
                    remainingBudgetUsd: budget.remainingUsd(),
                };
            } catch (error) {
                budget.settle(reservedUsd, 0);
                return { error: `Run of ${actor} failed: ${(error as Error).message}` };
            }
        },
    });

    const pushDatasetItems = createTool({
        id: 'push_dataset_items',
        description:
            'Pushes the final results to the output dataset. Pass `file` (a JSON array in the work directory) ' +
            'to push items a script wrote, or `items` for a few items. Items are checked against the output ' +
            'schema; nothing is pushed if any item fails.',
        inputSchema: z.object({
            file: z.string().optional(),
            items: z.array(z.record(z.string(), z.unknown())).optional(),
            limit: z.number().int().positive().optional().describe('Push only the first N items.'),
        }),
        execute: async ({ file, items, limit }) => {
            const loaded = file
                ? (JSON.parse(await readFile(resolveInside(workDir, file), 'utf8')) as Record<string, unknown>[])
                : (items ?? []);
            const batch = loaded.slice(0, limit ?? loaded.length);
            if (validateItem) {
                const errors = batch.flatMap((item, index) =>
                    validateItem(item)
                        ? []
                        : [`item ${index}: ${validateItem.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ')}`],
                );
                if (errors.length) return { error: 'Nothing pushed.', invalid: errors.slice(0, 10) };
            }
            await platform.pushItems(batch);
            state.pushedItems += batch.length;
            return { pushed: batch.length, totalPushed: state.pushedItems };
        },
    });

    const saveRecord = createTool({
        id: 'save_record',
        description: 'Saves a file (e.g. REPORT.md) to the run\'s key-value store under `key`, from `file` or `content`.',
        inputSchema: z.object({
            key: z.string().regex(/^[A-Za-z0-9!\-_.'()]{1,256}$/),
            file: z.string().optional(),
            content: z.string().optional(),
            contentType: z.string().default('text/markdown'),
        }),
        execute: async ({ key, file, content, contentType }) => {
            const value = file ? await readFile(resolveInside(workDir, file), 'utf8') : (content ?? '');
            await platform.setRecord(key, value, contentType);
            return { saved: key, bytes: Buffer.byteLength(value) };
        },
    });

    const finish = createTool({
        id: 'finish',
        description:
            'Ends the run. Call it once, after the results are pushed, with a one-paragraph summary for the user. ' +
            'Use status "failed" only when the task could not be done at all.',
        inputSchema: z.object({
            status: z.enum(['succeeded', 'failed']),
            summary: z.string().max(2000),
        }),
        execute: async ({ status, summary }) => {
            state.finished = { status, summary };
            return { ok: true };
        },
    });

    return { run_actor: runActor, push_dataset_items: pushDatasetItems, save_record: saveRecord, finish };
}
