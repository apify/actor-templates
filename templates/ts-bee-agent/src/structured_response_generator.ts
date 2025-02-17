import { OpenAIChatModel } from 'bee-agent-framework/adapters/openai/backend/chat';
import { Message } from 'bee-agent-framework/backend/message';
import { ZodSchema } from 'zod';

// Tool message interface
interface ToolMemoryMessage {
    toolName: string;
    input?: string | object;
    output?: string | object;
}
/**
 * Class representing a generator for structured output based on tool messages and user queries.
 */
export class StructuredOutputGenerator {
    private toolMemory: ToolMemoryMessage[] = [];
    private llm: OpenAIChatModel;

    constructor(llm: OpenAIChatModel) {
        this.llm = llm;
    }

    /**
     * Processes a tool message by either appending a new tool message or updating the last tool message.
     * @param key - The key indicating whether the message is a tool name, input, or output.
     * @param value - The value associated with the key, which can be a string or an object.
     */
    processToolMessage(key: 'tool_name' | 'tool_input' | 'tool_output', value: string | object): void {
        if (key === 'tool_name') {
            this.appendToolMessage(value as string);
        } else {
            this.updateLastToolMessage(key === 'tool_input' ? 'input' : 'output', value);
        }
    }

    /**
     * Appends a new tool message to the memory.
     * @param toolName Name of the tool.
     * @param input Optional input to the tool.
     * @param output Optional output from the tool.
     */
    appendToolMessage(toolName: string, input?: string | object, output?: string | object): void {
        this.toolMemory.push({
            toolName,
            input,
            output,
        });
    }

    /**
     * Updates the last tool message with input or output.
     * @param key Either 'input' or 'output'.
     * @param value The value to update.
     */
    updateLastToolMessage(key: 'input' | 'output', value: string | object): void {
        if (this.toolMemory.length > 0) {
            this.toolMemory[this.toolMemory.length - 1][key] = value;
        }
    }

    /**
     * Generates structured output based on the stored tool messages and user queries.
     * @param query The user's query.
     * @param schema The Zod schema for the structured output.
     * @returns Promise containing the structured output.
     */
    async generateStructuredOutput<T extends ZodSchema>(
        query: string,
        schema: T,
    ): Promise<{ object: T }> {
        const messages = [
            ...this.toolMemory.map((message) => Message.of({
                role: 'system',
                text: `Tool call: ${message.toolName}\ninput: ${JSON.stringify(message.input)}\n\noutput: ${JSON.stringify(message.output)}`,
            })),
            Message.of({
                role: 'user',
                text: query,
            }),
        ];

        return await this.llm.createStructure({
            schema,
            messages,
        });
    }

    /**
     * Clears the tool memory.
     */
    clearMemory(): void {
        this.toolMemory = [];
    }

    /**
     * Gets the current tool memory.
     */
    getToolMemory(): ToolMemoryMessage[] {
        return [...this.toolMemory];
    }
}
