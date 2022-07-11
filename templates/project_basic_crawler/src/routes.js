const Apify = require("apify");

const {
    utils: { log },
} = Apify;

exports.handleStart = async ({ url, label }) => {
    // Handle Start URLs
    const { body, statusCode } = await Apify.utils.requestAsBrowser({
        url,
        proxyUrl,
    });
    log.info("Page opened.", { label, url, statusCode});
    // start your code here using body for parsing data with your favorite libraries.
};

exports.handleList = async ({ url }) => {
    // Handle pagination
    const { body, statusCode } = await Apify.utils.requestAsBrowser({
        url,
        proxyUrl,
    });
    log.info("Page loaded: ", { url, statusCode, label });
    // start your code here using body for parsing data with your favorite libraries.
};

exports.handleDetail = async ({ url }) => {
    // Handle details
    const { body, statusCode } = await Apify.utils.requestAsBrowser({
        url,
        proxyUrl,
    });
    log.info("Page loaded: ", { url, statusCode, label });
    // start your code here using body for parsing data with your favorite libraries.
};
