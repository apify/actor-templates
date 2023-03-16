import { Actor } from 'apify';
import fs from 'fs';
import cypress from 'cypress';
import { globby } from 'globby';
import log from '@apify/log';
import 'console.table';

// run tests from specific test file with given configuration
const runOneSpec = (spec) => cypress.run({ config: input, spec });

await Actor.init();

const input = await Actor.getInput();
log.info(`Running tests with following input: ${JSON.stringify(input)}`);

const tests = await globby('./cypress/e2e/*-spec.cy.js');
log.info(`Getting tests: ${tests}`);

const testsResultsSummary = [];
const kvs = await Actor.openKeyValueStore();
const dataset = await Actor.openDataset();
for (const test of tests) {
    const result = await runOneSpec(test);
    let keyValueStoreLink;
    if (result?.config?.video) {
        const baseName = test.split('/').pop();
        const file = `./cypress/videos/${baseName}.mp4`;
        const kvsKeyName = baseName.replaceAll('.', '-');
        await kvs.setValue(kvsKeyName, fs.readFileSync(file), { contentType: 'video/mp4' });
        keyValueStoreLink = kvs.getPublicUrl(kvsKeyName);
    }

    const transformedResult = {
        testSuiteTitle: result.runs[0].tests ? result.runs[0].tests[0].title[0] : result.runs[0].spec.baseName,
        totalPassed: result.totalPassed,
        totalPending: result.totalPending,
        totalFailed: result.totalFailed,
        totalSkipped: result.totalSkipped,
        totalDuration: result.totalDuration,
        videoLink: keyValueStoreLink,
        rawData: result,
    };

    await dataset.pushData(transformedResult);
    testsResultsSummary.push(transformedResult);
}

const summary = testsResultsSummary
    .map((test) => {
        return {
            spec: test?.testSuiteTitle,
            passes: test?.totalPassed,
            failures: test?.totalFailed,
            pending: test?.totalPending,
            skipped: test?.totalSkipped,
            duration: test?.totalDuration,
        };
    });

console.table('Summary', summary);

await Actor.exit();
