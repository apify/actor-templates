import fs from 'node:fs';
import path from 'node:path';

import JSON5 from 'json5';

const TEMPLATES_DIRECTORY = path.join(import.meta.dirname, '../templates');

const tsTemplateIds = fs
    .readdirSync(TEMPLATES_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('ts-'))
    .map((entry) => entry.name);

describe('ts-template tsconfig', () => {
    // Regression for #754: @apify/tsconfig sets incremental:true, which writes
    // tsconfig.tsbuildinfo at the project root. After `rm -rf dist` it survives
    // and tricks tsc into skipping the next emit, so `apify push` ships an
    // empty actor. Templates opt out of incremental builds entirely.
    test.each(tsTemplateIds)('%s disables incremental builds', (templateId) => {
        const tsconfigPath = path.join(TEMPLATES_DIRECTORY, templateId, 'tsconfig.json');
        const tsconfig = JSON5.parse(fs.readFileSync(tsconfigPath, 'utf8'));

        expect(tsconfig.compilerOptions.incremental).toBe(false);
    });
});
