const Apify = require("apify");

Apify.main(async () => {
    // Add URLs to a RequestList from a sitemap
    const requestList = new Apify.RequestList({
        sources: [{ requestsFromUrl: "SITEMAP_URL_GOES_HERE" }]
    });
    // Initialize the RequestList
    await requestList.initialize();
    // Function called for each URL
    const handlePageFunction = async ({ request, $ }) => {
        console.log(request.url);
    };
    // Create a CheerioCrawler
    const crawler = new Apify.CheerioCrawler({
        requestList,
        handlePageFunction
    });
    // Run the crawler
    await crawler.run();
});
