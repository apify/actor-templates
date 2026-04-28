import fs from 'node:fs';
import path from 'node:path';

import JSON5 from 'json5';

const TEMPLATES_DIRECTORY = path.join(import.meta.dirname, '../templates');

const tsTemplateIds = fs
    .readdirSync(TEMPLATES_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('ts-'))
    .map((entry) => entry.name);

describe('ts-template tsconfig', () => {
    // Regression for #754: @apify/tsconfig sets incremental:true; without
    // tsBuildInfoFile inside outDir the buildinfo lands at the repo root and
    // survives `rm -rf dist`, tricking tsc into skipping the next emit.
    test.each(tsTemplateIds)('%s places tsBuildInfoFile inside outDir', (templateId) => {
        const tsconfigPath = path.join(TEMPLATES_DIRECTORY, templateId, 'tsconfig.json');
        const tsconfig = JSON5.parse(fs.readFileSync(tsconfigPath, 'utf8'));

        const { outDir, tsBuildInfoFile } = tsconfig.compilerOptions;
        expect(tsBuildInfoFile).toBe(`${outDir}/tsconfig.tsbuildinfo`);
    });
});
