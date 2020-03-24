const Apify = require("apify");

Apify.main(async () => {
    // Create a RequestQueue
    const requestQueue = await Apify.openRequestQueue();
    // Define the starting URL
    await requestQueue.addRequest({ url: "http://www.apify.com" });
    // Function called for each URL
    const handlePageFunction = async ({ request, $ }) => {
        console.log(request.url);
        // Add some links from page to RequestQueue
        await Apify.enqueueLinks({
            $,
            requestQueue,
            pseudoUrls: ["http[s?]://apify.com/store[.*]"]
        });
    };
    // Create a CheerioCrawler
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction
    });
    // Run the crawler
    await crawler.run();
});
