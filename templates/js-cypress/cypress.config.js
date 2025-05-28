import { defineConfig } from 'cypress';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    e2e: {
        // to be able to run the tests locally for Apify CLI versions 17.0.0 and older
        baseUrl: 'https://apify.com',
    },
});
