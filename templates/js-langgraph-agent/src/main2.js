// agent.ts

// import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { HumanMessage } from '@langchain/core/messages';
// import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

import { webSearchTool } from './tools.js';

dotenv.config({ path: '../.env' });

// IMPORTANT - Add your API keys here. Be careful not to publish them.
// process.env.OPENAI_API_KEY = 'sk-...';
// process.env.TAVILY_API_KEY = 'tvly-...';

// Define the tools for the agent to use
// const agentTools = [new TavilySearchResults({ maxResults: 3 })];

// Initialize memory to persist state between graph runs
const agent = createReactAgent({
    llm: new ChatOpenAI({ temperature: 0 }),
    tools: [webSearchTool],
});

// Now it's time to use!
console.log('Calling agent');
const agentFinalState = await agent.invoke(
    { messages: [new HumanMessage('How to build LangGraph agent at Apify platform?')] },
    { configurable: { thread_id: '1' } },
);

console.log(agentFinalState.messages[agentFinalState.messages.length - 1].content);
