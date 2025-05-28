import { Actor, log } from 'apify';

export async function chargeMessageRequest(args: { method: string }): Promise<void> {
    const { method } = args;

    // See https://modelcontextprotocol.io/specification/2025-03-26/server for more details
    // on the method names and protocol messages
    if (method.endsWith('/list')) {
        await Actor.charge({ eventName: 'list-request' });
        log.info(`Charged for list request: ${method}`);
    } else if (method.startsWith('tools/')) {
        await Actor.charge({ eventName: 'tool-request' });
        log.info(`Charged for tool request: ${method}`);
    } else if (method.startsWith('resources/')) {
        await Actor.charge({ eventName: 'resource-request' });
        log.info(`Charged for resource request: ${method}`);
    } else if (method.startsWith('prompts/')) {
        await Actor.charge({ eventName: 'prompt-request' });
        log.info(`Charged for prompt request: ${method}`);
    } else if (method.startsWith('completion/')) {
        await Actor.charge({ eventName: 'completion-request' });
        log.info(`Charged for completion request: ${method}`);
    } else {
        log.info(`Not charging for method: ${method}`);
    }
}
