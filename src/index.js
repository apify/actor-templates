const https = require('https');

const MANIFEST_URL = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json';

exports.fetchManifest = async () => {
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
                            resolve(data);
                        } catch (e) {
                            reject(e)
                        }
                    } else {
                        reject(new Error(`Status: ${res.statusCode}\n${json}`));
                    }
                })
                .on('error', (err) => reject(err))
        }).on('error', (err) => reject(err));
    })
};

exports.manifestUrl = MANIFEST_URL;

exports.fetchManifest().then(console.log)
