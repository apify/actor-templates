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
    const handleRequestFunction = async ({ request }) => {
        const { body } = await Apify.utils.requestAsBrowser(request);
        console.log(`URL: ${request.url}\nHTML:\n${body}`);
    };
    // Create a BasicCrawler
    const crawler = new Apify.BasicCrawler({
        requestList,
        handleRequestFunction,
    });
    // Run the crawler
    await crawler.run();
});
