// Source: https://github.com/supercorp-ai/supergateway
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

export function getVersion(): string {
    try {
        const packageJsonPath = join(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '1.0.0';
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Actorized MCP]', 'Unable to retrieve version:', err);
        return 'unknown';
    }
}
