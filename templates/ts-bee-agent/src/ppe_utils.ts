import { Actor, log } from 'apify';
import { BeeAgentRunIteration, BeeRunOutput } from 'bee-agent-framework/agents/bee/types';
import { PPE_EVENT } from './ppe_events.js';

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
 * @param modelName - The name of the model.
 * @param tokens - The number of tokens to charge for.
 * @throws Will throw an error if the model name is unknown.
 */
export async function chargeForModelTokens(modelName: string, tokens: number) {
    const tokensHundreds = Math.ceil(tokens / 100);
    log.debug(`Charging for ${tokens} tokens (${tokensHundreds} hundreds) for model ${modelName}`);

    if (modelName === 'gpt-4o') {
        await Actor.charge({ eventName: PPE_EVENT.OPENAI_100_TOKENS_GPT_4O, count: tokensHundreds });
    } else if (modelName === 'gpt-4o-mini') {
        await Actor.charge({ eventName: PPE_EVENT.OPENAI_100_TOKENS_GPT_4O_MINI, count: tokensHundreds });
    } else {
        throw new Error(`Unknown model name: ${modelName}`);
    }
}

export async function chargeForActorStart() {
    if (Actor.getChargingManager().getChargedEventCount(PPE_EVENT.ACTOR_START_GB) === 0) {
        const count = Math.ceil((Actor.getEnv().memoryMbytes || 1024) / 1024);
        await Actor.charge({ eventName: 'actor-start-gb', count });
    }
}
