import { expect, test } from '@playwright/test';

test('has appropriate size', async ({ page }) => {
    let totalDownloaded = 0;

    page.on('response', (r) => {
        r.body()
            .then((b) => {
                totalDownloaded += b.byteLength;
            })
            .catch(() => {
                // Ignore errors.
            });
    });

    await page.goto('https://apify.com/about', { waitUntil: 'networkidle' });

    // Expect the total amount of data to be less than 2 MB.
    expect(totalDownloaded).toBeLessThan(2 * 1024 * 1024);
});
