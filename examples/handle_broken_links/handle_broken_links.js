const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('my-list',
        [
            { url: 'http://www.example.com/page-1' },
            { url: 'http://www.example.com/page-2' },
            { url: 'http://www.example.com/page-3' },
        ]);
    // Function called for each successful request
    const handleRequestFunction = async ({ request }) => {
        if (request.url === 'http://www.example.com/page-3') {
            throw new Error('Request function failed.');
        } else {
            console.log(`[success] ${request.url}`);
        }
    };
    // Function called for each failed request
    const handleFailedRequestFunction = async ({ request, error }) => {
        console.log(`[failed] ${request.url} with error: ${error}`);
    };
    // Create a BasicCrawler
    const crawler = new Apify.BasicCrawler({
        requestList,
        handleRequestFunction,
        handleFailedRequestFunction,
        maxRequestRetries: 1,
    });
    // Run the crawler
    await crawler.run();
});
