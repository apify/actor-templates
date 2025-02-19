import { Actor } from 'apify';
import { BeeAgentRunIteration, BeeRunOutput } from 'bee-agent-framework/agents/bee/types';
import { PpeEvent } from './ppe_events.js';

/**
 * Computes the total number of tokens used for the agent output.
 *
 * @param {BeeRunOutput} response - The output of the bee agent run.
 * @returns {number} The total number of tokens used.
 */
export function beeOutputTotalTokens(response: BeeRunOutput): number {
    return response.iterations.reduce((sum: number, iteration: BeeAgentRunIteration) => {
        return sum + (iteration.raw.usage?.totalTokens || 0);
    }, 0);
}

/**
 * Charges for the tokens used by a specific model.
 *
 * @param {string} modelName - The name of the model.
 * @param {number} tokens - The number of tokens to charge for.
 * @throws Will throw an error if the model name is unknown.
 */
export async function chargetForModelTokens(modelName: string, tokens: number) {
    const tokensMillions = tokens / 1e6;
    if (modelName === 'gpt-4o') {
        await Actor.charge({ eventName: PpeEvent.OPENAI_1M_TOKENS_GPT_4O, count: tokensMillions });
    } else if (modelName === 'gpt-4o-mini') {
        await Actor.charge({ eventName: PpeEvent.OPENAI_1M_TOKENS_GPT_4O_MINI, count: tokensMillions });
    } else {
        throw new Error(`Unknown model name: ${modelName}`);
    }
}

export async function chargeForActorStart() {
    if (Actor.getChargingManager().getChargedEventCount(PpeEvent.ACTOR_START_GB) === 0) {
        const count = Math.ceil((Actor.getEnv().memoryMbytes || 1024) / 1024);
        await Actor.charge({ eventName: 'actor-start-gb', count });
    }
}
