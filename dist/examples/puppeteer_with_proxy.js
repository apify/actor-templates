const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('start-urls', [
        'http://proxy.apify.com',
    ]);

    // Proxy connection is automatically established in the Crawler
    const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        proxyConfiguration,
        handlePageFunction: async ({ page }) => {
            const status = await page.$eval('td.status', (el) => el.textContent);
            console.log(`Proxy Status: ${status}`);
        },
    });

    console.log('Running Puppeteer script...');
    await crawler.run();
    console.log('Puppeteer closed.');
});
