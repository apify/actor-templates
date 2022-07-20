const { Actor } = require('apify');
const { CheerioCrawler } = require('crawlee');

Actor.main(async () => {
    // Function called for each URL
    const requestHandler = async ({ request, body }) => {
        // Save data to default dataset
        await Actor.pushData({
            url: request.url,
            html: body,
        });
    };

    const crawler = new CheerioCrawler({
        requestHandler,
    });

    // Run the crawler
    await crawler.run([
        { url: 'http://www.example.com/page-1' },
        { url: 'http://www.example.com/page-2' },
        { url: 'http://www.example.com/page-3' },
    ]);
});
