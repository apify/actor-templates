import { Actor } from 'apify';
import type { ActorRun } from 'apify-client';

export type ActorRunResult = {
    runId: string;
    status: string;
    statusMessage?: string;
    items: unknown[];
    costUsd: number;
};

export type RunActorOptions = { maxTotalChargeUsd: number; timeoutSecs: number; maxItems: number };

/** What the agent needs from the platform. The tests replace it with a fake. */
export type Platform = {
    /** The smallest `maxTotalChargeUsd` the Actor accepts; 0 when it has none. */
    minimalChargeUsd(actorId: string): Promise<number>;
    runActor(actorId: string, input: unknown, options: RunActorOptions): Promise<ActorRunResult>;
    pushItems(items: Record<string, unknown>[]): Promise<void>;
    setRecord(key: string, value: string, contentType: string): Promise<void>;
};

/**
 * What a finished child run cost the user. For pay-per-event runs `usageTotalUsd` already includes the
 * event charges, but it can lag behind `chargedEventCounts` right after the run ends (seen in
 * production: $0 reported for a run that charged 27 events), so the larger of the two counts.
 */
export function estimateRunCostUsd(run: ActorRun): number {
    const pricing = run.pricingInfo;
    let chargesUsd = 0;
    if (pricing?.pricingModel === 'PAY_PER_EVENT') {
        for (const [event, count] of Object.entries(run.chargedEventCounts ?? {})) {
            chargesUsd += count * (pricing.pricingPerEvent.actorChargeEvents[event]?.eventPriceUsd ?? 0);
        }
    }
    return Math.max(run.usageTotalUsd ?? 0, chargesUsd);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apifyPlatform: Platform = {
    async minimalChargeUsd(actorId) {
        const actor = await Actor.apifyClient.actor(actorId).get();
        const pricing = actor?.pricingInfos?.at(-1);
        return pricing?.pricingModel === 'PAY_PER_EVENT' ? (pricing.minimalMaxTotalChargeUsd ?? 0) : 0;
    },
    async runActor(actorId, input, { maxTotalChargeUsd, timeoutSecs, maxItems }) {
        // The run token of a limited-permission Actor can start only limited-permission Actors;
        // the platform rejects the rest, and the error goes back to the agent as the tool result.
        const run = await Actor.call(actorId, input as Record<string, unknown>, {
            maxTotalChargeUsd,
            maxItems,
            timeout: timeoutSecs,
        });
        const { items } = await Actor.apifyClient.dataset(run.defaultDatasetId).listItems({ limit: maxItems });
        // Charges reach the run record a few seconds after the run ends (seen in production), so poll
        // briefly instead of trusting the object `call` returns.
        let finished = run;
        for (let attempt = 0; attempt < 5 && estimateRunCostUsd(finished) === 0; attempt++) {
            await sleep(2000);
            finished = (await Actor.apifyClient.run(run.id).get()) ?? finished;
        }
        return {
            runId: run.id,
            status: finished.status,
            statusMessage: finished.statusMessage,
            items,
            costUsd: estimateRunCostUsd(finished),
        };
    },
    async pushItems(items) {
        await Actor.pushData(items);
    },
    async setRecord(key, value, contentType) {
        await Actor.setValue(key, value, { contentType });
    },
};
