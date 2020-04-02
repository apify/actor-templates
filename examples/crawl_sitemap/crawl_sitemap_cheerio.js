const Apify = require('apify');

Apify.main(async () => {
    // Add URLs to a RequestList from a sitemap
    const requestList = new Apify.RequestList({
        sources: [{ requestsFromUrl: 'https://apify.com/sitemap.xml' }], // Sitemap url goes here
    });
    // Initialize the RequestList
    await requestList.initialize();
    // Function called for each URL
    const handlePageFunction = async ({ request }) => {
        console.log(request.url);
    };
    // Create a CheerioCrawler
    const crawler = new Apify.CheerioCrawler({
        requestList,
        handlePageFunction,
        maxRequestsPerCrawl: 10, // Limitation for only 10 requests (do not use if you want to crawl a sitemap)
    });
    // Run the crawler
    await crawler.run();
});
