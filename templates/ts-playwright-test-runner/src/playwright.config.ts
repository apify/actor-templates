import { defineConfig } from '@playwright/test';
export default defineConfig({
    timeout: 60000,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        colorScheme: 'light',
        locale: 'en-US',
        video: 'off',
    },
    reporter: [
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results.json' }]
    ],
});