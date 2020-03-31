const Apify = require('apify');

Apify.main(async () => {
    // Create a RequestList
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
        console.log(request.url);
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        handlePageFunction
    });
    // Run the crawler
    await crawler.run();
});
