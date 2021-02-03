const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('start-urls', [
        'https://en.wikipedia.org/wiki/Main_Page',
    ]);

    // Proxy connection is automatically established in the Crawler
    const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        proxyConfiguration,
        handlePageFunction: async ({ page }) => {
            const title = await page.title();
            console.log(`Page title: ${title}`);
        },
    });

    console.log('Running Puppeteer script...');
    await crawler.run();
    console.log('Puppeteer closed.');
});
