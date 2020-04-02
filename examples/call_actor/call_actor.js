const Apify = require('apify');

Apify.main(async () => {
    // Launch the web browser.
    const browser = await Apify.launchPuppeteer();

    console.log('Obtaining email address...');
    const user = await Apify.client.users.getUser();

    // Load Kraken.com charts and get last traded price of BTC
    console.log('Extracting data from kraken.com...');
    const page = await browser.newPage();
    await page.goto('https://www.kraken.com/charts');
    const tradedPricesHtml = await page.$eval('#ticker-top ul', el => el.outerHTML);

    // Send prices to your email. For that, you can use an actor we already
    // have available on the platform under the name: apify/send-mail.
    // The second parameter to the Apify.call() invocation is the actor's
    // desired input. You can find the required input parameters by checking
    // the actor's documentation page: https://apify.com/apify/send-mail
    console.log(`Sending email to ${user.email}...`);
    await Apify.call('apify/send-mail', {
        to: user.email,
        subject: 'Kraken.com BTC',
        html: `<h1>Kraken.com BTC</h1>${tradedPricesHtml}`,
    });

    console.log('Email sent. Good luck!');
});
