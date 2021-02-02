const Apify = require('apify');

Apify.main(async () => {
    // Add URLs to a RequestList from a sitemap
    const sources = [{ requestsFromUrl: 'https://apify.com/sitemap.xml' }];
    const requestList = await Apify.openRequestList('start-urls', sources);

    // Function called for each URL
    const handlePageFunction = async ({ request }) => {
        console.log(request.url);
    };

    // Create a crawler that runs Puppeteer
    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        handlePageFunction,
        maxRequestsPerCrawl: 10, // Limitation for only 10 requests (do not use if you want to crawl a sitemap)
    });

    // Run the crawler
    await crawler.run();
});
