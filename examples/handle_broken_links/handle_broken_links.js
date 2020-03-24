const Apify = require("apify");

Apify.main(async () => {
    // Get the HTML of a web page
    const { body } = await Apify.utils.requestAsBrowser({ url: 'https://www.example.com' });
    console.log(body);
});
