// Source: https://github.com/supercorp-ai/supergateway
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function getVersion(): string {
    try {
        const packageJsonPath = join(import.meta.dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '1.0.0';
    } catch (err) {
        console.error('[MCP]', 'Unable to retrieve version:', err);
        return 'unknown';
    }
}
