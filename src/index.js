const httpRequest = require('@apify/http-request');

const MANIFEST_URL = 'https://github.com/apifytech/actor-templates/raw/master/templates/manifest.json';

exports.fetchManifest = async () => {
    const { body } = await httpRequest({
        url: MANIFEST_URL,
        json: true,
        throwOnHttpErrors: true,
    });
    return body;
};

exports.manifestUrl = MANIFEST_URL;
