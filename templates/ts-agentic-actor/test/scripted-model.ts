/**
 * A fake LanguageModelV2 that plays back a script of tool calls, one per model call, and records
 * what the agent offered it. Lets the harness run end to end with no LLM and no cost.
 */
export type ToolCall = { toolName: string; args: Record<string, unknown> };
/** One model step: a tool call, several parallel tool calls, or a final text. */
export type ScriptedStep = ToolCall | { parallel: ToolCall[] } | { text: string };
const toolCallsOf = (step: ScriptedStep): ToolCall[] => ('parallel' in step ? step.parallel : 'toolName' in step ? [step] : []);

export type ModelCall = { toolNames: string[]; system: string; lastToolResult?: unknown };

export function createScriptedModel(script: (ScriptedStep | ((calls: ModelCall[]) => ScriptedStep))[]) {
    const calls: ModelCall[] = [];
    let index = 0;

    type CallOptions = { prompt: any[]; tools?: { name: string }[] };
    const next = (options: CallOptions): ScriptedStep => {
        const system = options.prompt.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
        const toolMessages = options.prompt.filter((m) => m.role === 'tool');
        const lastToolResult = toolMessages.at(-1)?.content?.at(-1)?.output;
        calls.push({ toolNames: (options.tools ?? []).map((t) => t.name), system, lastToolResult });
        const entry = script[index++] ?? { text: 'Script ended.' };
        return typeof entry === 'function' ? entry(calls) : entry;
    };

    const model = {
        specificationVersion: 'v2' as const,
        provider: 'scripted',
        modelId: 'scripted',
        supportedUrls: {},
        async doGenerate(options: CallOptions) {
            const step = next(options);
            const content =
                'text' in step
                    ? [{ type: 'text', text: step.text }]
                    : toolCallsOf(step).map((c, i) => ({
                          type: 'tool-call',
                          toolCallId: `call-${index}-${i}`,
                          toolName: c.toolName,
                          input: JSON.stringify(c.args),
                      }));
            return {
                content,
                finishReason: 'text' in step ? 'stop' : 'tool-calls',
                usage: { inputTokens: 1000, outputTokens: 100, totalTokens: 1100 },
                warnings: [],
            };
        },
        async doStream(options: CallOptions) {
            const step = next(options);
            const usage = { inputTokens: 1000, outputTokens: 100, totalTokens: 1100 };
            const parts: unknown[] = [{ type: 'stream-start', warnings: [] }];
            if ('text' in step) {
                parts.push(
                    { type: 'text-start', id: 't' },
                    { type: 'text-delta', id: 't', delta: step.text },
                    { type: 'text-end', id: 't' },
                    { type: 'finish', finishReason: 'stop', usage },
                );
            } else {
                parts.push(
                    ...toolCallsOf(step).map((c, i) => ({
                        type: 'tool-call',
                        toolCallId: `call-${index}-${i}`,
                        toolName: c.toolName,
                        input: JSON.stringify(c.args),
                    })),
                    { type: 'finish', finishReason: 'tool-calls', usage },
                );
            }
            return {
                stream: new ReadableStream({
                    start(controller) {
                        for (const part of parts) controller.enqueue(part);
                        controller.close();
                    },
                }),
            };
        },
    };
    return { model, calls };
}
