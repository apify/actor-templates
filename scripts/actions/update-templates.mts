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

const baseImages = BASE_IMAGE.split(',');

async function updateDockerfile(filePath: URL) {
    const content = await readFile(filePath, 'utf-8');

    const lineSplit = content.split('\n');

    for (const [idx, line] of lineSplit.entries()) {
        if (!line.includes('FROM')) {
            continue;
        }

        for (const baseImage of baseImages) {
            const fromLineSplit = lineSplit[idx].split(' ');
            const fromLineSplitIndex = fromLineSplit.findIndex((piece) => piece.includes(`${baseImage}:`));

            if (fromLineSplitIndex === -1) {
                continue;
            }

            console.log(
                `Updating Dockerfile: ${filePath} with base image: ${baseImage}, runtime version: ${DEFAULT_RUNTIME_VERSION}${MODULE_VERSION ? `, module version: ${MODULE_VERSION}` : ''}`,
            );

            fromLineSplit[fromLineSplitIndex] = `${baseImage}:${DEFAULT_RUNTIME_VERSION}`;

            if (MODULE_VERSION) {
                fromLineSplit[fromLineSplitIndex] += `-${MODULE_VERSION}`;
            }

            lineSplit[idx] = fromLineSplit.join(' ');
        }
    }

    await writeFile(filePath, lineSplit.join('\n'), 'utf-8');
}

const puppeteerDependencies = ['puppeteer'];
const playwrightDependencies = ['playwright', '@playwright/test'];

async function updatePackageJson(filePath: URL) {
    if (!BASE_IMAGE.includes('node')) {
        return;
    }

    const content = await readFile(filePath, 'utf-8');

    const packageJson = JSON.parse(content);

    let dependenciesToUpdate: string[] = [];

    // Handle playwright
    if (BASE_IMAGE!.includes('playwright')) {
        dependenciesToUpdate = playwrightDependencies;
    }

    // Handle puppeteer
    if (BASE_IMAGE!.includes('puppeteer')) {
        dependenciesToUpdate = puppeteerDependencies;
    }

    for (const dependency of dependenciesToUpdate) {
        if (packageJson.dependencies?.[dependency]) {
            console.log(`Updating package.json: ${filePath} with dependency: ${dependency} version: ${MODULE_VERSION}`);
            packageJson.dependencies[dependency] = MODULE_VERSION!;
        }

        if (packageJson.devDependencies?.[dependency]) {
            console.log(
                `Updating package.json: ${filePath} with dev dependency: ${dependency} version: ${MODULE_VERSION}`,
            );
            packageJson.devDependencies[dependency] = MODULE_VERSION!;
        }
    }

    await writeFile(filePath, JSON.stringify(packageJson, null, 4) + '\n', 'utf-8');
}

for await (const fileEntry of glob(['**/Dockerfile', '**/package.json'], { cwd: templatesDir })) {
    const filePath = new URL(fileEntry, templatesDir);

    if (fileEntry.endsWith('Dockerfile')) {
        await updateDockerfile(filePath);
    } else if (fileEntry.endsWith('package.json')) {
        await updatePackageJson(filePath);
    }
}

const rootPackageJson = new URL('../../package.json', import.meta.url);
await updatePackageJson(rootPackageJson);
