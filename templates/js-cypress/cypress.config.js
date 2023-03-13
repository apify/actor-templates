import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        // to be able to run the tests locally
        baseUrl: 'https://apify.com',
    },
});
