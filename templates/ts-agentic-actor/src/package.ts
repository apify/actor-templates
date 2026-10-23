import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

/** `agent/agent.json`. Input fields of the same name may lower the limits, never raise them. */
const AgentConfigSchema = z.object({
    model: z.object({
        id: z.string(),
        usdPerMillionInputTokens: z.number().nonnegative(),
        usdPerMillionOutputTokens: z.number().nonnegative(),
    }),
    limits: z.object({
        maxSteps: z.number().int().positive(),
        maxBudgetUsd: z.number().positive(),
        maxActorRunBudgetUsd: z.number().positive(),
        commandTimeoutSecs: z.number().int().positive().default(120),
    }),
    actors: z.object({
        allow: z.array(z.string()).default([]),
        allowDiscovery: z.boolean().default(false),
    }),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export type AgentPackage = {
    dir: string;
    name: string;
    description: string;
    /** AGENT.md without its frontmatter. */
    instructions: string;
    config: AgentConfig;
    /** `fields` of `.actor/dataset_schema.json`, used to validate pushed items. */
    datasetItemSchema?: Record<string, unknown>;
};

function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
    const match = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);
    if (!match) return { meta: {}, body: markdown };
    const meta = Object.fromEntries(
        match[1]
            .split('\n')
            .map((line) => line.split(/:(.*)/s).map((part) => part.trim()))
            .filter(([key, value]) => key && value),
    );
    return { meta, body: markdown.slice(match[0].length) };
}

export async function loadAgentPackage(actorDir: string): Promise<AgentPackage> {
    const dir = path.join(actorDir, 'agent');
    const { meta, body } = parseFrontmatter(await readFile(path.join(dir, 'AGENT.md'), 'utf8'));
    const config = AgentConfigSchema.parse(JSON.parse(await readFile(path.join(dir, 'agent.json'), 'utf8')));
    const datasetSchema = await readFile(path.join(actorDir, '.actor', 'dataset_schema.json'), 'utf8')
        .then((text) => JSON.parse(text) as { fields?: Record<string, unknown> })
        .catch(() => undefined);
    return {
        dir,
        name: meta.name ?? 'agent',
        description: meta.description ?? '',
        instructions: body,
        config,
        datasetItemSchema: datasetSchema?.fields,
    };
}
