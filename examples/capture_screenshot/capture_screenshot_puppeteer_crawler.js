const Apify = require("apify");

Apify.main(async () => {
    // Add URLs to a RequestList
    const requestList = new Apify.RequestList({
        sources: [
            { url: 'http://www.example.com/page-1' },
            { url: 'http://www.example.com/page-2' },
            { url: 'http://www.example.com/page-3' }
        ]
    });
    // Initialize the RequestList
    await requestList.initialize();
    // Function called for each URL
    const handlePageFunction = async ({ request, page }) => {
        // Capture the screenshot with Puppeteer
        const screenshot = await page.screenshot();
        // Convert the URL into a valid key
        const key = request.url.replace(/[:/]/g, '_');
        // Save the screenshot to the default key-value store
        await Apify.setValue(key, screenshot, { contentType: 'image/png' });
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        handlePageFunction
    });
    // Run the crawler
    await crawler.run();
});