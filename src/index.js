const https = require('https');

const TEMPLATE_MANIFEST_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json';
const WRAPPER_MANIFEST_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/wrappers/manifest.json';

exports.fetchManifest = async (url = TEMPLATE_MANIFEST_URL) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let json = '';
            res
                .on('data', (chunk) => {
                    json += chunk;
                })
                .on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const data = JSON.parse(json);
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

exports.manifestUrl = TEMPLATE_MANIFEST_URL;
exports.wrapperManifestUrl = WRAPPER_MANIFEST_URL;
