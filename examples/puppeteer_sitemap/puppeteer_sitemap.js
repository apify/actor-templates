const Apify = require('apify');

Apify.main(async () => {
    const requestList = new Apify.RequestList({
        sources: [{ requestsFromUrl: 'https://apify.com/sitemaps.xml' }],
    });
    await requestList.initialize();

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        maxRequestsPerCrawl: 10,
        handlePageFunction: async ({ page, request }) => {
            console.log(`Processing ${request.url}...`);
            await Apify.pushData({
                url: request.url,
                title: await page.title(),
                html: await page.content(),
            });
        },
    });

    await crawler.run();
    console.log('Done.');
});
