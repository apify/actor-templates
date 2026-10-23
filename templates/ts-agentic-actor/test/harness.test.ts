import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { loadAgentPackage } from '../src/package.ts';
import type { Platform } from '../src/platform.ts';
import { runAgent } from '../src/run.ts';
import { createScriptedModel, type ToolCall } from './scripted-model.ts';

const ACTOR_DIR = path.resolve(import.meta.dirname, '..');

const INSTAGRAM_POSTS = [
    { ownerUsername: 'veggie_anna', likesCount: 900, commentsCount: 40 },
    { ownerUsername: 'veggie_anna', likesCount: 1100, commentsCount: 60 },
    { ownerUsername: 'tiny_cook', likesCount: 10, commentsCount: 1 },
];
const INSTAGRAM_PROFILES = [
    { username: 'veggie_anna', followersCount: 25000 },
    { username: 'tiny_cook', followersCount: 300 },
];
const TIKTOK_VIDEOS = [{ authorMeta: { name: 'plantchef', fans: 120000 }, diggCount: 8000, commentCount: 200 }];

function fakePlatform() {
    const pushed: Record<string, unknown>[] = [];
    const records: Record<string, string> = {};
    const runs: { actor: string; maxTotalChargeUsd: number }[] = [];
    const platform: Platform = {
        async minimalChargeUsd(actor) {
            return actor === 'clockworks/tiktok-scraper' ? 0.5 : 0;
        },
        async runActor(actor, input, { maxTotalChargeUsd }) {
            runs.push({ actor, maxTotalChargeUsd });
            const items =
                actor === 'apify/instagram-hashtag-scraper'
                    ? INSTAGRAM_POSTS
                    : actor === 'apify/instagram-profile-scraper'
                      ? INSTAGRAM_PROFILES
                      : TIKTOK_VIDEOS;
            return { runId: `run-${runs.length}`, status: 'SUCCEEDED', items, costUsd: 0.05 };
        },
        async pushItems(items) {
            pushed.push(...items);
        },
        async setRecord(key, value) {
            records[key] = value;
        },
    };
    return { platform, pushed, records, runs };
}

const call = (toolName: string, args: Record<string, unknown>): ToolCall => ({ toolName, args });

describe('agentic Actor runtime', () => {
    it('runs a package end to end: skills, Actor runs, a skill script, validated output', async () => {
        process.env.APIFY_TOKEN = 'secret-run-token';
        const pkg = await loadAgentPackage(ACTOR_DIR);
        const { platform, pushed, records, runs } = fakePlatform();
        const { model, calls } = createScriptedModel([
            call('skill', { name: 'social-sourcing' }),
            call('run_actor', { actor: 'apify/instagram-hashtag-scraper', input: { hashtags: ['vegancooking'] }, saveAs: 'instagram' }),
            call('run_actor', { actor: 'apify/instagram-profile-scraper', input: { usernames: ['veggie_anna'] }, saveAs: 'instagram-profiles' }),
            call('run_actor', { actor: 'clockworks/tiktok-scraper', input: { hashtags: ['vegancooking'] }, saveAs: 'tiktok' }),
            call('run_actor', { actor: 'someone/unlisted-actor', input: {}, saveAs: 'other' }),
            call('mastra_workspace_execute_command', { command: 'env' }),
            call('mastra_workspace_execute_command', {
                command: 'python3 agent/skills/influencer-scoring/scripts/score.py data/raw data/scored.json --exclude data/exclude.txt',
            }),
            call('push_dataset_items', { file: 'data/scored.json', limit: 20 }),
            call('save_record', { key: 'REPORT.md', content: '# Report' }),
            call('finish', { status: 'succeeded', summary: 'Found 2 influencers.' }),
        ]);

        const report = await runAgent({
            pkg,
            input: { topic: 'vegan cooking', maxBudgetUsd: 2 },
            model: model as never,
            platform,
            workDir: await mkdtemp(path.join(os.tmpdir(), 'agent-test-')),
        });

        assert.equal(report.stopReason, 'finished');
        assert.equal(report.status, 'succeeded');
        assert.ok(calls[0].toolNames.includes('skill'), 'skills are offered');
        assert.match(calls[0].system, /social-sourcing/, 'skill index is in the system prompt');

        assert.deepEqual(
            runs.map((r) => r.actor),
            ['apify/instagram-hashtag-scraper', 'apify/instagram-profile-scraper', 'clockworks/tiktok-scraper'],
            'the unlisted Actor was not run',
        );
        assert.ok(runs[0].maxTotalChargeUsd > 0.9 && runs[0].maxTotalChargeUsd <= 1, 'each child run is capped');
        assert.match(JSON.stringify(calls[5].lastToolResult), /not allowed/);
        assert.doesNotMatch(JSON.stringify(calls[6].lastToolResult), /secret-run-token/, 'scripts never see the token');

        assert.deepEqual(
            pushed.map((item) => item.handle),
            ['plantchef', 'veggie_anna'],
            'scored, sorted, below-threshold author dropped',
        );
        assert.equal(records['REPORT.md'], '# Report');
        assert.equal(report.budget.actorsUsd, 0.15);
        assert.equal(report.budget.limitUsd, 2, 'input lowered the package limit');
    });

    it('gives parallel Actor calls in one step each a share of the budget', async () => {
        const pkg = await loadAgentPackage(ACTOR_DIR);
        const { platform, runs } = fakePlatform();
        const { model } = createScriptedModel([
            {
                parallel: [
                    call('run_actor', { actor: 'apify/instagram-hashtag-scraper', input: {}, saveAs: 'instagram' }),
                    call('run_actor', { actor: 'clockworks/tiktok-scraper', input: {}, saveAs: 'tiktok' }),
                ],
            },
            call('finish', { status: 'succeeded', summary: 'ok' }),
        ]);
        await runAgent({
            pkg,
            input: { topic: 'x', maxBudgetUsd: 2 },
            model: model as never,
            platform,
            workDir: await mkdtemp(path.join(os.tmpdir(), 'agent-test-')),
        });
        assert.equal(runs.length, 2, 'the second call was not starved');
        assert.ok(runs.every((r) => r.maxTotalChargeUsd > 0.2));
        assert.ok((runs.find((r) => r.actor === 'clockworks/tiktok-scraper')?.maxTotalChargeUsd ?? 0) >= 0.5, 'minimum respected');
    });

    it('rejects items that do not match the dataset schema', async () => {
        const pkg = await loadAgentPackage(ACTOR_DIR);
        const { platform, pushed } = fakePlatform();
        const { model, calls } = createScriptedModel([
            call('push_dataset_items', { items: [{ platform: 'myspace', handle: 'x' }] }),
            call('finish', { status: 'failed', summary: 'Nothing valid.' }),
        ]);
        const report = await runAgent({
            pkg,
            input: { topic: 'x' },
            model: model as never,
            platform,
            workDir: await mkdtemp(path.join(os.tmpdir(), 'agent-test-')),
        });
        assert.equal(pushed.length, 0);
        assert.match(JSON.stringify(calls[1].lastToolResult), /Nothing pushed/);
        assert.equal(report.status, 'failed');
    });

    it('stops when the budget is used up', async () => {
        const pkg = await loadAgentPackage(ACTOR_DIR);
        const { platform } = fakePlatform();
        // Each scripted step costs 1000 input + 100 output tokens = $0.0015 at the package price.
        const { model } = createScriptedModel(
            Array.from({ length: 20 }, () => call('mastra_workspace_list_files', { path: '.' })),
        );
        const report = await runAgent({
            pkg,
            input: { topic: 'x', maxBudgetUsd: 0.004 },
            model: model as never,
            platform,
            workDir: await mkdtemp(path.join(os.tmpdir(), 'agent-test-')),
        });
        assert.equal(report.stopReason, 'budget');
        assert.equal(report.steps, 3);
    });
});
