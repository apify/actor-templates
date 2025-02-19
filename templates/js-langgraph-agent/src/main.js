import { HumanMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Actor, log } from 'apify';

import { webSearchTool } from './tools.js';

const Event = {
    ACTOR_STARTED: 'actor-start-gb',
    INPUT_TOKENS_COUNT_GPT4O: 'input-tokens-count-gpt-4o',
    OUTPUT_TOKENS_COUNT_GPT4O: 'output-tokens-count-gpt-4o',
    TASK_COMPLETED: 'task-completed',
};

await Actor.init();

try {
    const actorStartChargeCount = Math.ceil((Actor.getEnv().memoryMbytes || 1024) / 1024);
    log.info(`Required memory: ${Actor.getEnv().memoryMbytes}. Charging Actor start event as ${actorStartChargeCount} GB`);
    for (let i = 0; i < actorStartChargeCount; i++) {
        await Actor.charge({ eventName: Event.ACTOR_STARTED });
    }
} catch (error) {
    log.error('Failed to charge for actor start event', { error });
    await Actor.exit(1);
}

// Follow these steps to run this template:
// 1. If running locally, authenticate to the Apify platform by executing `apify login` in your terminal.
//    This is necessary to run the Website Content Crawler Actor for data gathering.
// 2. Set the `OPENAI_API_KEY` environment variable with your OpenAI API key, which can be obtained from
//    https://platform.openai.com/account/api-keys. Refer to
//    https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console for guidance
//    on setting environment variables.
const { OPENAI_API_KEY, APIFY_TOKEN } = process.env;

// You can configure the input for the Actor in the Apify UI when running on the Apify platform or editing
// storage/key_value_stores/default/INPUT.json when running locally.
const {
    query = 'How to build LangGraph agent at Apify platform?',
    modelName = 'gpt-4o',
} = await Actor.getInput() || {};

if (!OPENAI_API_KEY) throw new Error('Please configure the OPENAI_API_KEY as environment variable or enter it into the input!');
if (!APIFY_TOKEN) throw new Error('Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.');

const agent = createReactAgent({
    llm: new ChatOpenAI({ temperature: 0, model: modelName }),
    tools: [webSearchTool],
});

let agentFinalState;
try {
    log.info('Starting agent ...');
    agentFinalState = await agent.invoke(
        { messages: [new HumanMessage('How to build LangGraph agent at Apify platform?')] },
        { configurable: { thread_id: '1' } },
    );
} catch (error) {
    log.error('Failed to run the agent', { error });
    await Actor.exit(1);
}

const answer = agentFinalState.messages[agentFinalState.messages.length - 1].content;

log.info(`Question: ${query}`);
log.info(`Agent response: ${answer}`);

// sum of all usage tokens for all messages
const usageTokensInput = agentFinalState.messages.map((m) => m?.usage_metadata?.input_tokens).reduce((acc, tokens) => acc + (tokens || 0), 0);
const usageTokensOutput = agentFinalState.messages.map((m) => m?.usage_metadata?.output_tokens).reduce((acc, tokens) => acc + (tokens || 0), 0);
log.info(`Number of messages: ${agentFinalState.messages.length}`);
log.info(`Charging for tokens usage, input tokens: (${usageTokensInput}, output tokens: (${usageTokensOutput}`);

try {
    await Actor.charge({ eventName: Event.INPUT_TOKENS_COUNT_GPT4O, count: usageTokensInput / 1e6 });
    await Actor.charge({ eventName: Event.OUTPUT_TOKENS_COUNT_GPT4O, count: usageTokensOutput / 1e6 });
} catch (error) {
    log.error('Failed to charge for tokens usage', { error });
    await Actor.exit(1);
}

log.info('Pushing data to the key-value store');
await Actor.pushData({ question: query, answer });

log.info('Task completion event charged');
await Actor.charge({ eventName: Event.TASK_COMPLETED });

await Actor.exit();
