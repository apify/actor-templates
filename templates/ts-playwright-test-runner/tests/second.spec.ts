import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('https://crawlee.dev/');
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Crawlee/);
});

test('get started link', async ({ page }) => {
    await page.goto('https://crawlee.dev/');
    // Click the get started link.
    await page.getByRole('link', { name: 'Get started' }).click();
    // Expects the URL to contain introduction.
    await expect(page).toHaveURL(/.*introduction/);
});
