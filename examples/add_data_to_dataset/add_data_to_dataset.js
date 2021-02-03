const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('start-urls',
        [
            { url: 'http://www.example.com/page-1' },
            { url: 'http://www.example.com/page-2' },
            { url: 'http://www.example.com/page-3' },
        ]);

    // Function called for each URL
    const handlePageFunction = async ({ request, body }) => {
        // Save data to default dataset
        await Apify.pushData({
            url: request.url,
            html: body,
        });
    };

    const crawler = new Apify.CheerioCrawler({
        requestList,
        handlePageFunction,
    });

    // Run the crawler
    await crawler.run();
});
