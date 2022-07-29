/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const { Actor } = require('apify');
const { CheerioCrawler, log } = require('crawlee');
const { handleStart, handleList, handleDetail } = require('./src/routes');

Actor.main(async () => {
    const { startUrls } = await Actor.getInput();

    const proxyConfiguration = await Actor.createProxyConfiguration();

    const crawler = new CheerioCrawler({
        proxyConfiguration,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency: 50,
        async requestHandler(context) {
            const { url, userData: { label } } = context.request;
            context.log.info('Page opened.', { label, url });
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
