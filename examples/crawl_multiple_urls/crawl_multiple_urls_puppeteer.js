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
    const handlePageFunction = async ({ request }) => {
        console.log(request.url);
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        handlePageFunction,
    });
    // Run the crawler
    await crawler.run();
});
