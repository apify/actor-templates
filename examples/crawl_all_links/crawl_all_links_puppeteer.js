const Apify = require('apify');

Apify.main(async () => {
    // Create a RequestQueue
    const requestQueue = await Apify.openRequestQueue();
    // Define the starting URL
    await requestQueue.addRequest({ url: 'https://apify.com/' });
    // Function called for each URL
    const handlePageFunction = async ({ request, page }) => {
        console.log(request.url);
        // Add all links from page to RequestQueue
        await Apify.utils.enqueueLinks({
            page,
            requestQueue,
        });
    };
    // Create a PuppeteerCrawler
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction,
        maxRequestsPerCrawl: 10, // Limitation for only 10 requests (do not use if you want to crawl all links)
    });
    // Run the crawler
    await crawler.run();
});
