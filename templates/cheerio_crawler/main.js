/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require('apify');
const { handleStart, handleList, handleDetail } = require('./src/routes');

const { utils: { log, createRequestDebugInfo } } = Apify;

Apify.main(async () => {
    const { startUrls } = await Apify.getInput();

    const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();

    const crawler = new Apify.CheerioCrawler({
        requestList,
        requestQueue,
        useApifyProxy: true,
        useSessionPool: true,
        persistCookiesPerSession: true,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency: 50,
        // You can remove this if you won't
        // be scraping any JSON endpoints.
        additionalMimeTypes: [
            'application/json',
        ],
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
        handleFailedRequestFunction: async ({ request, error }) => {
            const { url, userData: { label } } = request;
            log.exception(error, 'Failed to process request.', { label, url });
            // Remove the below lines if you absolutely need to have no other items
            // in dataset than results. Otherwise, keep it. It's useful for debugging.
            const debugInfo = createRequestDebugInfo(request, {}, request.userData);
            await Apify.pushData({ '#error': true, '#debug': debugInfo });
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
