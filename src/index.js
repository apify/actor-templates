const { fetch } = require('undici');

const MANIFEST_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json';
const CONSOLE_README_SUFFIX_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/consoleReadmeSuffix.md';
const LOCAL_README_SUFFIX_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/localReadmeSuffix.md';

exports.fetchManifest = async () => {
    try {
        const manifestResponse = await fetch(MANIFEST_URL);

        if (manifestResponse.status !== 200) throw new Error(`Could not fetch manifest from ${MANIFEST_URL}`);

        const manifestData = await manifestResponse.json();
        const consoleResponse = await fetch(CONSOLE_README_SUFFIX_URL);
        const localResponse = await fetch(LOCAL_README_SUFFIX_URL);

        if (consoleResponse.status === 200) {
            manifestData.consoleReadmeSuffix = await consoleResponse.text();
        }

        if (localResponse.status === 200) {
            manifestData.localReadmeSuffix = await localResponse.text();
        }

        return manifestData;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

exports.manifestUrl = MANIFEST_URL;
