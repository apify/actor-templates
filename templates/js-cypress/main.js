import { Actor } from 'apify';
import log from '@apify/log';
import fs from 'fs';
import path from 'path';
import cypress from 'cypress';
import { globby } from 'globby';

await Actor.init();

const { video, defaultCommandTimeout, viewportHeight, viewportWidth } = await Actor.getInput();

const runOneSpec = (spec) => {
return cypress.run({
    config: {
        video,
        defaultCommandTimeout,
        viewportHeight,
        viewportWidth,
    },
    spec,
})
}

const tests = await globby('./cypress/e2e/*-spec.cy.js');

console.log(`Running tests from following files: ${tests}`)

const kvs = await Actor.openKeyValueStore();
const dataset = await Actor.openDataset();
for (const test of tests) {
    const result = await runOneSpec(test);
    // todo: now pushing the whole result object, maybe pick-up some interesting stuff only
    await dataset.pushData(result);
    const baseName = test.split('/').pop();
    const file = `./cypress/videos/${baseName}.mp4`
    await kvs.setValue(baseName.replaceAll('.', '-'), fs.readFileSync(file), { contentType: 'video/mp4' });
}

await Actor.exit();
