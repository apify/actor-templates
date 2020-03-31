const Apify = require('apify');

// A link to a list of Fortune 500 companies' websites available on GitHub.
const CSV_LINK =
    'https://gist.githubusercontent.com/hrbrmstr/ae574201af3de035c684/raw/f1000.csv';

Apify.main(async () => {
    // Add URLs to a RequestList from a sitemap
    const requestList = new Apify.RequestList({
        sources: [{ requestsFromUrl: CSV_LINK }] // Sitemap url goes here
    });
    // Initialize the RequestList
    await requestList.initialize();
    // Function called for each URL
    const handleRequestFunction = async ({ request }) => {
        console.log(request.url);
    };
    // Create a BasicCrawler
    const crawler = new Apify.BasicCrawler({
        requestList,
        handleRequestFunction,
        maxRequestsPerCrawl: 10 // Limitation for only 10 requests (do not use if you want to crawl a sitemap)
    });
    // Run the crawler
    await crawler.run();
});
