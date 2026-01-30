// eslint-disable-next-line import/extensions
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { Actor, log } from 'apify';
import { createAgent } from 'langchain';

import { webSearchTool } from './tools.js';

await Actor.init();

log.info('Charging Actor start event.');
await Actor.charge({ eventName: 'actor-start' });

// Follow these steps to run this template:
// 1. If running locally, authenticate to the Apify platform by executing `apify login` in your terminal.
//    This is necessary to run the Website Content Crawler Actor for data gathering.
// 2. Set the `OPENAI_API_KEY` environment variable with your OpenAI API key, which can be obtained from
//    https://platform.openai.com/account/api-keys. Refer to
//    https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console for guidance
//    on setting environment variables.
const { OPENAI_API_KEY, APIFY_TOKEN } = process.env;
const { query, modelName } = (await Actor.getInput()) ?? {};

if (!OPENAI_API_KEY) {
    throw new Error('Please configure the OPENAI_API_KEY as environment variable.');
}
if (!APIFY_TOKEN) {
    throw new Error('Please configure the APIFY_TOKEN environment variable. Call `apify login` in your terminal.');
}

const agent = createAgent({
    model: new ChatOpenAI({ temperature: 0, model: modelName }),
    tools: [webSearchTool],
});

log.info('Starting agent...');
const agentFinalState = await agent.invoke(
    { messages: [new HumanMessage(query)] },
    { configurable: { thread_id: '1' } },
);

if (!agentFinalState?.messages?.length) {
    throw new Error('Agent did not return a valid response.');
}

const answer = agentFinalState.messages.at(-1).content;

log.info(`Question: ${query}`);
log.info(`Agent response: ${answer}`);
log.info(`Number of messages: ${agentFinalState.messages.length}`);

log.info('Pushing data to the dataset');
await Actor.pushData({ question: query, answer });

log.info('Charging for task completion');
await Actor.charge({ eventName: 'task-completed' });

await Actor.exit();
