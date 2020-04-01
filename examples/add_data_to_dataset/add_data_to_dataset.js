const Apify = require('apify');

Apify.main(async () => {
    const requestList = Apify.openRequestList('my-list',
        [
            { url: 'http://www.example.com/page-1' },
            { url: 'http://www.example.com/page-2' },
            { url: 'http://www.example.com/page-3' },
        ]);
    // Function called for each URL
    const handleRequestFunction = async ({ request }) => {
        // Open a dataset
        const dataset = await Apify.openDataset('my-cool-dataset');
        // Add data to dataset
        await dataset.pushData({ url: request.url });
    };
    const crawler = new Apify.BasicCrawler({
        requestList,
        handleRequestFunction,
    });
    // Run the crawler
    await crawler.run();
});
