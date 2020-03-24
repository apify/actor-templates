const Apify = require("apify");

Apify.main(async () => {
    const input = await Apify.getInput();
    console.log(input);
});
