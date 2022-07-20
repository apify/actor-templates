/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const { Actor } = require('apify');
const { log, PlaywrightCrawler } = require('crawlee');
// const playwright = require('playwright');
const { handleStart, handleList, handleDetail } = require('./src/routes');

Actor.main(async () => {
    const { startUrls } = await Actor.getInput();

    const proxyConfiguration = await Actor.createProxyConfiguration();

    const crawler = new PlaywrightCrawler({
        proxyConfiguration,
        launchContext: {
            // To use Firefox or WebKit on the Apify Platform,
            // don't forget to change the image in Dockerfile
            // launcher: playwright.firefox,
            useChrome: true,
            // We don't have 'stealth' for Playwright yet.
            // Try using Firefox, it is naturally stealthy.
        },
        browserPoolOptions: {
            // This allows browser to be more effective against anti-scraping protections.
            // If you are having performance issues try turning this off.
            // By default, this is enabled
            // useFingerprints: false,
        },
        async requestHandler(context) {
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
