import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        // to be able to run the tests locally for Apify CLI versions 17.0.0 and older
        baseUrl: 'https://apify.com',
    },
});
