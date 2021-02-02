const Apify = require('apify');

Apify.main(async () => {
    // Create a RequestList
    const requestList = await Apify.openRequestList('my-list',
        [
            { url: 'http://www.example.com/page-1' },
            { url: 'http://www.example.com/page-2' },
            { url: 'http://www.example.com/page-3' },
        ]);
    // Function called for each URL
    const handlePageFunction = async ({ request, page }) => {
        const title = await page.title();
        console.log(`URL: ${request.url}\nTITLE: ${title}`);
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PlaywrightCrawler({
        requestList,
        handlePageFunction,
    });
    // Run the crawler
    await crawler.run();
});
