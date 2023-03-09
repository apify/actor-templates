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
    let keyValueStoreLink = '';
    if (result.config.video) {
        const baseName = test.split('/').pop();
        const file = `./cypress/videos/${baseName}.mp4`;
        const kvsKeyName = baseName.replaceAll('.', '-');
        await kvs.setValue(kvsKeyName, fs.readFileSync(file), { contentType: 'video/mp4' });

        keyValueStoreLink = await kvs.getPublicUrl(kvsKeyName);
        result.keyValueStoreLink = keyValueStoreLink;
    }
    const transformedResult = {
        testSuiteTitle: result.runs[0].tests[0].title[0],
        totalPassed: result.totalPassed,
        totalPending: result.totalPending,
        totalFailed: result.totalFailed,
        totalSkipped: result.totalSkipped,
		totalDuration: result.totalDuration,
        videoLink: result.keyValueStoreLink || 'N/A',
        rawData: result,
    }
    await dataset.pushData(transformedResult);
}

await Actor.exit();
