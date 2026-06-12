import { defineConfig } from 'cypress';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
    e2e: {
        // to be able to run the tests locally for Apify CLI versions 17.0.0 and older
        // Defaults to a stable demo site; override it via the Actor `baseUrl` input.
        baseUrl: 'https://example.com',
    },
});
