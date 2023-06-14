const https = require('https');

const MANIFEST_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json';
const CONSOLE_README_SUFFIX_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/console_readme_suffix.md';
const LOCAL_README_SUFFIX_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/local_readme_suffix.md';

const fetchResource = async (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let text = '';
            res
                .on('data', (chunk) => {
                    text += chunk;
                })
                .on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(text);
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error(`Url: ${url}\n${text}`));
                    }
                })
                .on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
};

exports.fetchManifest = async () => {
    const manifestStr = await fetchResource(MANIFEST_URL);
    const manifest = JSON.parse(manifestStr);

    try {
        const consoleReadmeSuffix = await fetchResource(CONSOLE_README_SUFFIX_URL);
        const localReadmeSuffix = await fetchResource(LOCAL_README_SUFFIX_URL);
        manifest.consoleReadmeSuffix = consoleReadmeSuffix;
        manifest.localReadmeSuffix = localReadmeSuffix;
    } catch (e) {
        // Could not fetch the suffixes
        console.error('Could not fetch the suffixes.', e);
    }

    return manifest;
};

exports.manifestUrl = MANIFEST_URL;
