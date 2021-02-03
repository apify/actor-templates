const Apify = require('apify');

Apify.main(async () => {
    // Add URLs to a RequestList
    const requestList = await Apify.openRequestList('start-urls',
        [
            { url: 'http://www.example.com/page-1' },
            { url: 'http://www.example.com/page-2' },
            { url: 'http://www.example.com/page-3' },
        ]);
    // Function called for each URL
    const handlePageFunction = async ({ request, page }) => {
        // Convert the URL into a valid key
        const key = request.url.replace(/[:/]/g, '_');
        // Capture the screenshot
        await Apify.utils.puppeteer.saveSnapshot(page, { key, saveHtml: false });
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        handlePageFunction,
    });
    // Run the crawler
    await crawler.run();
});
