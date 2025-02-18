import { HumanMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Actor, log } from 'apify';

import { webSearchTool } from './tools.js';

await Actor.init();

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
    openAIApiKey = OPENAI_API_KEY, // This is a fallback to the OPENAI_API_KEY environment variable when value is not present in the input.
} = await Actor.getInput() || {};

if (!openAIApiKey) throw new Error('Please configure the OPENAI_API_KEY as environment variable or enter it into the input!');
if (!APIFY_TOKEN) throw new Error('Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.');

// Initialize memory to persist state between graph runs
const agent = createReactAgent({
    llm: new ChatOpenAI({ temperature: 0 }),
    tools: [webSearchTool],
});

// Now it's time to use!
log.info('Starting agent ...');
const agentFinalState = await agent.invoke(
    { messages: [new HumanMessage('How to build LangGraph agent at Apify platform?')] },
    { configurable: { thread_id: '1' } },
);

const answer = agentFinalState.messages[agentFinalState.messages.length - 1].content;

log.info(`Question: ${query}`);
log.info(`Agent response: ${answer}`);

await Actor.pushData({ question: query, answer });
await Actor.exit();
