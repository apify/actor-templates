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
    const memoryMbytes = Actor.getEnv().memoryMbytes || 1024;
    const memoryGB = Math.ceil(memoryMbytes / 1024);
    log.info(`Required memory: ${memoryGB} GB. Charging Actor start event.`);
    await Actor.charge({ eventName: Event.ACTOR_STARTED, count: memoryGB });
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
    // query = 'How to build LangGraph agent at Apify platform?',
    query = 'This is fallback test query, do nothing and ignore it.',
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
        { messages: [new HumanMessage(query)] },
        { configurable: { thread_id: '1' } },
    );
} catch (error) {
    log.error('Failed to run the agent', { error });
    await Actor.exit(1);
}

if (!agentFinalState || !agentFinalState.messages?.length) {
    log.error('Agent did not return a valid response.');
    await Actor.exit(1);
}

const answer = agentFinalState.messages[agentFinalState.messages.length - 1].content;

log.info(`Question: ${query}`);
log.info(`Agent response: ${answer}`);

log.info(`Number of messages: ${agentFinalState.messages.length}`);
const usageTokens = agentFinalState.messages.reduce((acc, msg) => {
    acc.input += msg?.usage_metadata?.input_tokens || 0;
    acc.output += msg?.usage_metadata?.output_tokens || 0;
    return acc;
}, { input: 0, output: 0 });

log.info(`Charging token usage. Input: ${usageTokens.input}, Output: ${usageTokens.output}`);

try {
    await Actor.charge({ eventName: Event.INPUT_TOKENS_COUNT_GPT4O, count: usageTokens.input / 1e6 });
    await Actor.charge({ eventName: Event.OUTPUT_TOKENS_COUNT_GPT4O, count: usageTokens.output / 1e6 });
} catch (error) {
    log.error('Failed to charge for tokens usage', { error });
    await Actor.exit(1);
}

log.info('Pushing data to the key-value store');
await Actor.pushData({ question: query, answer });

log.info('Task completion event charged');
await Actor.charge({ eventName: Event.TASK_COMPLETED });

await Actor.exit();
