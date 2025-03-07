import { Actor, log } from 'apify';
import { BeeAgent } from 'bee-agent-framework/agents/bee/agent';
import { UnconstrainedMemory } from 'bee-agent-framework/memory/unconstrainedMemory';
import { z } from 'zod';
import { LangChainChatModel } from 'bee-agent-framework/adapters/langchain/backend/chat';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIChatModel } from 'bee-agent-framework/adapters/openai/backend/chat';
import { CalculatorSumTool } from './tools/calculator.js';
import { InstagramScrapeTool } from './tools/instagram.js';
import { StructuredOutputGenerator } from './structured_response_generator.js';

// This is an ESM project, and as such, it requires you to specify extensions in your relative imports.
// Read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// Note that we need to use `.js` even when inside TS files
// import { router } from './routes.js';

// Actor input schema
interface Input {
    query: string;
    modelName: string;
    debug?: boolean;
}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

// Charge for Actor start
await Actor.charge({ eventName: 'actor-start' });

// Handle input
const {
    // The query default value is provided only for template testing purposes.
    // You can remove it.
    query,
    modelName,
    debug,
} = await Actor.getInput() as Input;
if (debug) {
    log.setLevel(log.LEVELS.DEBUG);
}
if (!query) {
    throw new Error('An agent query is required.');
}

/**
 * Actor code
*/
// Create a ReAct agent that can use tools.
// See https://i-am-bee.github.io/bee-agent-framework/#/agents?id=bee-agent
// In order to use PPE, the LangChain adapter must be used
// otherwise, the token usage is not tracked.
log.debug(`Using model: ${modelName}`);
const llm = new LangChainChatModel(
    new ChatOpenAI({ model: modelName }),
);
// The LangChain adapter does not work with the structured output generation
// for some reason.
// Create a separate LLM for structured output generation.
const llmStructured = new OpenAIChatModel(modelName);
const agent = new BeeAgent({
    llm,
    memory: new UnconstrainedMemory(),
    tools: [new CalculatorSumTool(),
        new InstagramScrapeTool()],
});

// Store tool messages for later structured output generation.
// This can be removed if you don't need structured output.
const structuredOutputGenerator = new StructuredOutputGenerator(llmStructured);

// Prompt the agent with the query.
// Debug log agent status updates, e.g., thoughts, tool calls, etc.
const response = await agent
    .run({ prompt: query })
    .observe((emitter) => {
        emitter.on('update', async ({ update }) => {
            log.debug(`Agent (${update.key}) 🤖 : ${update.value}`);

            // Save tool messages for later structured output generation.
            // This can be removed if you don't need structured output.
            if (['tool_name', 'tool_output', 'tool_input'].includes(update.key as string)) {
                structuredOutputGenerator.processToolMessage(
                    update.key as 'tool_name' | 'tool_output' | 'tool_input',
                    update.value,
                );
            }
            // End of tool message saving.
        });
    });

log.info(`Agent 🤖 : ${response.result.text}`);

// Hacky way to get the structured output.
// Using the stored tool messages and the user query to create a structured output.
const structuredResponse = await structuredOutputGenerator.generateStructuredOutput(query,
    z.object({
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
    }));
log.debug(`Structured response: ${JSON.stringify(structuredResponse)}`);

// Charge for task completion
await Actor.charge({ eventName: 'task-completed' });

// Push results to the dataset.
await Actor.pushData({
    query,
    response: response.result.text,
    // This can be removed if you don't need structured output.
    structuredResponse: structuredResponse.object,
});
log.info('Pushed the data into the dataset!');

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
