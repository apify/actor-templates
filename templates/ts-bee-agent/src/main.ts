// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, log } from 'apify';
import { OpenAIChatModel } from 'bee-agent-framework/adapters/openai/backend/chat';
import { BeeAgent } from 'bee-agent-framework/agents/bee/agent';
import { UnconstrainedMemory } from 'bee-agent-framework/memory/unconstrainedMemory';
import { Message } from 'bee-agent-framework/backend/message';
import { z } from 'zod';
import { CalculatorSumTool } from './tool_calculator.js';
import { InstagramScrapeTool } from './tool_instagram.js';
// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
// import { CheerioCrawler } from 'crawlee';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
// import { router } from './routes.js';

// Actor input schema
interface Input {
    query: string;
    model: string;
    openaiApiKey: string;
    debug?: boolean;
}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

// Handle input
const {
    query,
    model = 'gpt-4o-mini',
    openaiApiKey,
    debug,
} = await Actor.getInput() as Input;
if (debug) {
    log.setLevel(log.LEVELS.DEBUG);
}
if (!query) {
    throw new Error('An agent query is required.');
}
if (!openaiApiKey) {
    throw new Error('An OpenAI API key is required.');
}
process.env.OPENAI_API_KEY = openaiApiKey;

/**
 * Actor code
 */

// Create a ReAct agent that can use tools
// See https://i-am-bee.github.io/bee-agent-framework/#/agents?id=bee-agent
const llm = new OpenAIChatModel(model);
const agent = new BeeAgent({
    llm,
    memory: new UnconstrainedMemory(),
    tools: [new CalculatorSumTool(),
        new InstagramScrapeTool()],
});

// Tool message structure
interface ToolMemoryMessage {
    toolName: string;
    input?: string | object;
    output?: string | object;
}

// Stores tool messages for later structured output generation
const toolMemory: ToolMemoryMessage[] = [];

// Prompt the agent with the query
// Debug log agent status updates, e.g., thoughts, tool calls, etc.
const response = await agent
    .run({ prompt: query })
    .observe((emitter) => {
        emitter.on('update', async ({ update }) => {
            log.debug(`Agent (${update.key}) 🤖 : ${update.value}`);

            // Save tool messages for later structured output generation
            if (update.key === 'tool_name') {
                toolMemory.push({ toolName: update.value });
            } else if (update.key === 'tool_input') {
                toolMemory[toolMemory.length - 1].input = update.value;
            } else if (update.key === 'tool_output') {
                toolMemory[toolMemory.length - 1].output = update.value;
            }
        });
    });

log.info(`Agent 🤖 : ${response.result.text}`);

// Hacky way to get the structured output
// Using the stored tool messages and the user query to create a structured output
// based on the schema
const structuredResponse = await llm.createStructure({
    // the object is optional and nullable in case the query doesn't ask
    // for this information
    schema: z.object({
        totalLikes: z.number(),
        totalComments: z.number(),
        mostPopularPosts: z.array(z.object({
            url: z.string(),
            likes: z.number(),
            comments: z.number(),
            timestamp: z.string(),
            caption: z.string().nullable().optional(),
            alt: z.string().nullable().optional(),
        })),
    }).partial(),
    // Add the tool messages and the user query to prompt for the structured output
    messages: [
        ...toolMemory.map((message) => Message.of({
            role: 'system',
            text: `Tool call: ${message.toolName}\ninput: ${message.input}\n\noutput: ${message.output}`,
        })),
        Message.of({
            role: 'user',
            text: query,
        }),
    ],
});

log.debug(`Structured response: ${JSON.stringify(structuredResponse)}`);

const store = await Actor.openKeyValueStore();
await store.setValue('response.txt', response.result.text);
log.info('Saved the "response.txt" file into the key-value store!');

await Actor.pushData({
    response: response.result.text,
    structuredResponse: structuredResponse.object,
});
log.info('Pushed the into the dataset!');

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
