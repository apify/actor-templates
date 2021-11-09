const Apify = require('apify');

Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: 'https://www.iana.org/' });

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction: async ({ request, page }) => {
            const title = await page.title();
            console.log(`Title of ${request.url}: ${title}`);
            await Apify.utils.enqueueLinks({
                page,
                requestQueue,
                pseudoUrls: ['https://www.iana.org/[.*]'],
            });
        },
        maxRequestsPerCrawl: 10,
    });

    await crawler.run();
});
