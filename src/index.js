import https from 'node:https';

const manifestUrl = 'https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json';
const wrapperManifestUrl = 'https://raw.githubusercontent.com/apify/actor-templates/master/wrappers/manifest.json';

export async function fetchManifest(url = manifestUrl) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                let json = '';
                res.on('data', (chunk) => {
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
            })
            .on('error', (err) => reject(err));
    });
}

// keep default export for BC
export default { fetchManifest };
