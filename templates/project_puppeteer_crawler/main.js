/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const { Actor } = require('apify');
const { PuppeteerCrawler, log } = require('crawlee');
const { handleStart, handleList, handleDetail } = require('./src/routes');

Actor.main(async () => {
    const { startUrls } = await Actor.getInput();

    const proxyConfiguration = await Actor.createProxyConfiguration();

    const crawler = new PuppeteerCrawler({
        proxyConfiguration,
        launchContext: {
            // Chrome with stealth should work for most websites.
            // If it doesn't, feel free to remove this.
            useChrome: true,
        },
        browserPoolOptions: {
            // This allows browser to be more effective against anti-scraping protections.
            // If you are having performance issues try turning this off.
            useFingerprints: true,
        },
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            log.info('Page opened.', { label, url });
            switch (label) {
                case 'LIST':
                    return handleList(context);
                case 'DETAIL':
                    return handleDetail(context);
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run(startUrls);
    log.info('Crawl finished.');
});
