const Apify = require("apify");

Apify.main(async () => {
    await Apify.call("apify/send-mail", {
        to: "person@example.com",
        subject: "Hello World",
        html: "<h1>This is an example.</h1>"
    });
});
