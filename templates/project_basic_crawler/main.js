/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require("apify");
const { handleStart, handleList, handleDetail } = require("./src/routes");

const {
    utils: { log },
} = Apify;

Apify.main(async () => {
    const { startUrls } = await Apify.getInput();

    const requestList = await Apify.openRequestList("start-urls", startUrls);
    const requestQueue = await Apify.openRequestQueue();

    const proxyConfiguration = await Apify.createProxyConfiguration();
    global.proxyUrl = proxyConfiguration.newUrl();

    const crawler = new Apify.BasicCrawler({
        requestList,
        requestQueue,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency: 50,
        maxRequestRetries: 3,
        handleRequestFunction: async ({ request }) => {
            const {
                userData: { label },
            } = request;
            switch (label) {
                case "LIST":
                    return handleList(request);
                case "DETAIL":
                    return handleDetail(request);
                default:
                    return handleStart(request);
            }
        },
    });
    log.info("Starting the crawl.");
    await crawler.run();
    log.info("Crawl finished.");
});
