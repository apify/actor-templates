import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { Agent } from '@mastra/core/agent';
import type { MastraModelConfig } from '@mastra/core/llm';
import { LocalFilesystem, LocalSandbox, Workspace } from '@mastra/core/workspace';

import { Budget } from './budget.ts';
import type { AgentPackage } from './package.ts';
import type { Platform } from './platform.ts';
import { composeFirstMessage, composeInstructions } from './prompt.ts';
import { createRuntimeTools, type RunState } from './tools.ts';

export type TraceStep = { step: number; text?: string; toolCalls: { name: string; args: string }[]; spentUsd: number };

export type RunReport = {
    status: 'succeeded' | 'failed';
    stopReason: 'finished' | 'max-steps' | 'budget' | 'no-tool-call';
    summary: string;
    steps: number;
    budget: ReturnType<Budget['summary']>;
    pushedItems: number;
    actorRuns: RunState['actorRuns'];
    trace: TraceStep[];
};

export type RunAgentOptions = {
    pkg: AgentPackage;
    input: Record<string, unknown>;
    model: MastraModelConfig;
    platform: Platform;
    /** Empty directory the agent works in; the package is copied into `agent/` inside it. */
    workDir: string;
    /** Extra tools, e.g. Apify MCP `fetch-actor-details`. */
    extraTools?: Record<string, unknown>;
    log?: (message: string) => void;
};

/** Input can lower the package's limits, never raise them. */
function resolveLimits(pkg: AgentPackage, input: Record<string, unknown>) {
    const lower = (packageValue: number, inputValue: unknown) =>
        typeof inputValue === 'number' && inputValue > 0 ? Math.min(packageValue, inputValue) : packageValue;
    return {
        maxSteps: lower(pkg.config.limits.maxSteps, input.maxSteps),
        maxBudgetUsd: lower(pkg.config.limits.maxBudgetUsd, input.maxBudgetUsd),
    };
}

export async function runAgent({ pkg, input, model, platform, workDir, extraTools = {}, log = () => {} }: RunAgentOptions) {
    const limits = resolveLimits(pkg, input);
    const budget = new Budget(limits.maxBudgetUsd, pkg.config.model);
    const state: RunState = { pushedItems: 0, actorRuns: [] };

    await cp(pkg.dir, path.join(workDir, 'agent'), { recursive: true });
    await mkdir(path.join(workDir, 'data'), { recursive: true });

    const workspace = new Workspace({
        filesystem: new LocalFilesystem({ basePath: workDir }),
        // The run's container is the sandbox: it is isolated per run and billed to the user. Commands
        // get no host environment, so APIFY_TOKEN never reaches a script the model wrote.
        sandbox: new LocalSandbox({
            workingDirectory: workDir,
            env: { PATH: process.env.PATH, HOME: workDir, LANG: 'C.UTF-8' },
            timeout: pkg.config.limits.commandTimeoutSecs * 1000,
        }),
        skills: ['agent/skills'],
    });
    await workspace.init();

    const tools = createRuntimeTools({
        platform,
        budget,
        config: pkg.config,
        workDir,
        state,
        datasetItemSchema: pkg.datasetItemSchema,
    });
    const agent = new Agent({
        id: 'agentic-actor',
        name: pkg.name,
        instructions: composeInstructions(pkg, limits),
        model,
        tools: { ...tools, ...(extraTools as Record<string, never>) },
        workspace,
    });

    const trace: TraceStep[] = [];
    // stopWhen runs before onStepFinish, so tokens are counted here to stop on the step that used
    // the budget up, not one step later.
    let countedSteps = 0;
    const countTokens = (steps: { usage?: { inputTokens?: number; outputTokens?: number } }[]) => {
        for (const step of steps.slice(countedSteps)) budget.addTokens(step.usage?.inputTokens, step.usage?.outputTokens);
        countedSteps = steps.length;
    };
    const result = await agent.generate(composeFirstMessage(input), {
        maxSteps: limits.maxSteps,
        stopWhen: [
            ({ steps }: { steps: unknown[] }) => steps.length >= limits.maxSteps,
            () => Boolean(state.finished),
            ({ steps }: { steps: Parameters<typeof countTokens>[0] }) => {
                countTokens(steps);
                return budget.isExhausted();
            },
        ],
        onStepFinish: (step) => {
            const toolCalls = step.toolCalls.map((call) => ({
                name: call.payload.toolName,
                args: JSON.stringify(call.payload.args ?? {}).slice(0, 500),
            }));
            trace.push({ step: trace.length + 1, text: step.text || undefined, toolCalls, spentUsd: budget.spentUsd() });
            log(`Step ${trace.length}: ${toolCalls.map((c) => c.name).join(', ') || 'text'} ($${budget.spentUsd().toFixed(4)})`);
        },
    });

    // The last step ends the loop without a stopWhen check.
    countTokens(result.steps);

    let stopReason: RunReport['stopReason'] = 'no-tool-call';
    if (state.finished) stopReason = 'finished';
    else if (budget.isExhausted()) stopReason = 'budget';
    else if (trace.length >= limits.maxSteps) stopReason = 'max-steps';

    // A run that stopped early still succeeds when it pushed results; the summary says it was cut short.
    const succeeded = state.finished ? state.finished.status === 'succeeded' : state.pushedItems > 0;
    const report: RunReport = {
        status: succeeded ? 'succeeded' : 'failed',
        stopReason,
        summary: state.finished?.summary ?? (result.text || `The agent stopped (${stopReason}) before calling finish.`),
        steps: trace.length,
        budget: budget.summary(),
        pushedItems: state.pushedItems,
        actorRuns: state.actorRuns,
        trace,
    };
    return report;
}
