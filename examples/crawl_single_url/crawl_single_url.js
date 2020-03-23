const Apify = require("apify");

const request = require("request-promise");
Apify.main(async () => {
    // Get the HTML of a web page
    const html = await request("https://www.example.com");
});

// TODO: change request to apify.utils.requestAsBrowser