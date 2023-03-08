import { Actor } from 'apify';
import fs from 'fs';
import cypress from 'cypress';
import { globby } from 'globby';

await Actor.init();

// todo: be able to send everything in input
const { video, defaultCommandTimeout, viewportHeight, viewportWidth, ...rest } = await Actor.getInput();

const runOneSpec = (spec) => {
return cypress.run({
    config: {
        video,
        defaultCommandTimeout,
        viewportHeight,
        viewportWidth,
        ...rest,
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
    const baseName = test.split('/').pop();
    const file = `./cypress/videos/${baseName}.mp4`
    await kvs.setValue(baseName.replaceAll('.', '-'), fs.readFileSync(file), { contentType: 'video/mp4' });
    // todo: now pushing the whole result object, maybe pick-up some interesting stuff only
    // dataset: fields co chci včetně kvs url -> struktura podle default cypress table, pak přidám objekt rawData: a tam vše co cypress vrací
    await dataset.pushData(result);
}

await Actor.exit();
