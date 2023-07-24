import { test, expect } from '@playwright/test';

test('has appropriate size', async ({ page }) => {
    let totalDownloaded = 0;

    await page.on('response', async (r) => {
        totalDownloaded += await (await r.body()).byteLength;
    });

    await page.goto('https://apify.com/about', { waitUntil: 'networkidle' });

    // Expect the total amount of data to be less than 2 MB.
    expect(totalDownloaded).toBeLessThan(2 * 1024 * 1024);
});
