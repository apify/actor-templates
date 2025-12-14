import { glob, readFile, writeFile } from 'node:fs/promises';

const { BASE_IMAGE, DEFAULT_RUNTIME_VERSION, MODULE_VERSION } = process.env;

if (!BASE_IMAGE) {
    throw new Error('BASE_IMAGE is not set');
}

if (!DEFAULT_RUNTIME_VERSION) {
    throw new Error('DEFAULT_RUNTIME_VERSION is not set');
}

if (BASE_IMAGE.includes('playwright') || BASE_IMAGE.includes('puppeteer')) {
    if (!MODULE_VERSION) {
        throw new Error('MODULE_VERSION is not set');
    }
}

console.log(`Updating templates for base image: ${BASE_IMAGE}`);
console.log(`Default runtime version: ${DEFAULT_RUNTIME_VERSION}`);
console.log(`Module version (Playwright or Puppeteer or similar): ${MODULE_VERSION}`);

const templatesDir = new URL('../../templates/', import.meta.url);

for await (const dockerfileEntry of glob('**/Dockerfile', { cwd: templatesDir })) {
    const filePath = new URL(dockerfileEntry, templatesDir);
    const content = await readFile(filePath, 'utf-8');

    const lineSplit = content.split('\n');

    for (const [idx, line] of lineSplit.entries()) {
        if (!line.includes('FROM')) {
            continue;
        }

        const fromLineSplit = lineSplit[idx].split(' ');
        const fromLineSplitIndex = fromLineSplit.findIndex((piece) => piece.includes(`${BASE_IMAGE}:`));

        if (fromLineSplitIndex === -1) {
            continue;
        }

        console.log(`Updating Dockerfile: ${filePath}`);

        fromLineSplit[fromLineSplitIndex] = `${BASE_IMAGE}:${DEFAULT_RUNTIME_VERSION}`;

        if (MODULE_VERSION) {
            fromLineSplit[fromLineSplitIndex] += `-${MODULE_VERSION}`;
        }

        lineSplit[idx] = fromLineSplit.join(' ');
    }

    await writeFile(filePath, lineSplit.join('\n'), 'utf-8');
}
