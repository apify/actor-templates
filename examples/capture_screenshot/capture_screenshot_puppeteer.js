const Apify = require('apify');
Apify.main(async () => {
    const url = "http://www.example.com/";
    // Launch Puppeteer
    const browser = await Apify.launchPuppeteer();
    // Open a new page
    const page = await browser.newPage();
    // Navigate to the URL
    const response = await page.goto(url);
    // Capture the screenshot
    const screenshot = await page.screenshot();
    // Convert the URL into a valid key
    const key = response.url().replace(/[:/]/g, '_');
    // Save the screenshot to the default key-value store
    await Apify.setValue(key, screenshot, { contentType: 'image/png' });
    // Close Puppeteer
    await browser.close();
});
