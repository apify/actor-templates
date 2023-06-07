const https = require('https');

const MANIFEST_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json';
const CONSOLE_README_SUFFIX_URL = "https://raw.githubusercontent.com/apify/actor-templates/master/templates/consoleReadmeSuffix.md"
const LOCAL_README_SUFFIX_URL ="https://raw.githubusercontent.com/apify/actor-templates/master/templates/localReadmeSuffix.md"

/**
 * This will fetches the readme suffixes for the console and local templates.
 * These suffixes are then added to the manifest object at the root level
 */
async function fetchReadmeSuffixes() {
    let consoleReadmeSuffix = "";
    let localReadmeSuffix = "";

    try {
        const consoleResponse = await fetch(CONSOLE_README_SUFFIX_URL);
        const localResponse = await fetch(LOCAL_README_SUFFIX_URL);
        consoleReadmeSuffix = await consoleResponse.text();
        localReadmeSuffix = await localResponse.text();
    } catch(error) {
        console.log(error);
    }

    return { consoleReadmeSuffix, localReadmeSuffix }
}

exports.fetchManifest = async () => {
    const { consoleReadmeSuffix,localReadmeSuffix } = await fetchReadmeSuffixes();

    return new Promise((resolve, reject) => {
        https.get(MANIFEST_URL, (res) => {
            let json = '';
            res
                .on('data', (chunk) => {
                    json += chunk;
                })
                .on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const data = JSON.parse(json);
                            data.consoleReadmeSuffix = consoleReadmeSuffix;
                            data.localReadmeSuffix = localReadmeSuffix;
                            resolve(data);
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error(`Status: ${res.statusCode}\n${json}`));
                    }
                })
                .on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
};

exports.manifestUrl = MANIFEST_URL;
