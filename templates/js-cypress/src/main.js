// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';
import fs from 'fs';

// Component and E2E testing library (read more at https://docs.cypress.io/guides/overview/why-cypress)
import cypress from 'cypress';
// File system traversing library (read more at https://www.jsdocs.io/package/globby)
import { globby } from 'globby';
// Apify logging utility library
import log from '@apify/log';
// Library for console logging tables
import 'console.table';

// Helper function to run tests from specific test file with given configuration from INPUT.json
const runOneSpec = (spec) => cypress.run({ config: input, spec });

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

// Define the configuration to start the cypress test with - get it from the input of the Actor or use a default config.
const input = await Actor.getInput() || { baseUrl: "https://apify.com", video: true };
log.info(`Running tests with following input: ${JSON.stringify(input)}`);

// Get cypress test files from ./cypress/e2e that end with spec.cy.js
const tests = await globby('./cypress/e2e/*-spec.cy.js');
log.info(`Getting tests: ${tests}`);

const testsResultsSummary = [];

// Opens an instance of Key-value store (read more https://docs.apify.com/sdk/js/reference/class/Actor#openKeyValueStore)
const kvs = await Actor.openKeyValueStore();
// Opens an instance of Dataset (read more https://docs.apify.com/sdk/js/reference/class/Actor#openDataset)
const dataset = await Actor.openDataset();

// Run tests one by one
for (const test of tests) {
    const result = await runOneSpec(test);
    let keyValueStoreLink;
    // Save video recording of the test to Key-value store
    if (result?.config?.video) {
        const baseName = test.split('/').pop();
        const file = `./cypress/videos/${baseName}.mp4`;
        const kvsKeyName = baseName.replaceAll('.', '-');
        // Saves video to Key-value store under kvsKeyName (read more at https://docs.apify.com/sdk/js/reference/class/KeyValueStore#setValue)
        await kvs.setValue(kvsKeyName, fs.readFileSync(file), { contentType: 'video/mp4' });
        keyValueStoreLink = kvs.getPublicUrl(kvsKeyName);
    }

    // Transform the test results
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

    // Save transformed test results to Dataset (read more at https://docs.apify.com/sdk/js/reference/class/Dataset#pushData)
    await dataset.pushData(transformedResult);
    testsResultsSummary.push(transformedResult);
}

// Create a loggable test summary
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

// Log the summary as a table
console.table('Summary', summary);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
