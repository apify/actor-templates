// eslint-disable-next-line import/extensions
import { HumanMessage } from '@langchain/core/messages';
// eslint-disable-next-line import/extensions
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Actor, log } from 'apify';

import { webSearchTool } from './tools.js';

await Actor.init();

try {
    log.info('Charging Actor start event.');
    await Actor.charge({ eventName: 'actor-start' });
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
const { query, modelName } = (await Actor.getInput()) || {};

if (!OPENAI_API_KEY)
    throw new Error('Please configure the OPENAI_API_KEY as environment variable or enter it into the input!');
if (!APIFY_TOKEN)
    throw new Error(
        'Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.',
    );

const agent = createReactAgent({
    llm: new ChatOpenAI({ temperature: 0, model: modelName }),
    tools: [webSearchTool],
});

let agentFinalState;
try {
    log.info('Starting agent ...');
    agentFinalState = await agent.invoke({ messages: [new HumanMessage(query)] }, { configurable: { thread_id: '1' } });
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
log.info('Charging for task completion');

try {
    await Actor.charge({ eventName: 'task-completed' });
} catch (error) {
    log.error('Failed to charge for task completion', { error });
    await Actor.exit(1);
}

log.info('Pushing data to the key-value store');
await Actor.pushData({ question: query, answer });

log.info('Task completion event charged');
await Actor.charge({ eventName: Event.TASK_COMPLETED });

await Actor.exit();
