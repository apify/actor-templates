const Apify = require('apify');

Apify.main(async () => {
    // Apify.launchPuppeteer() is similar to Puppeteer's launch() function.
    // It accepts the same parameters and returns a preconfigured Puppeteer.Browser instance.
    // Moreover, it accepts several additional options, such as useApifyProxy.
    const options = {
        useApifyProxy: true,
    };
    const browser = await Apify.launchPuppeteer(options);

    console.log('Running Puppeteer script...');

    // Proceed with a plain Puppeteer script.
    const page = await browser.newPage();
    const url = 'https://en.wikipedia.org/wiki/Main_Page';
    await page.goto(url);
    const title = await page.title();

    console.log(`Page title: ${title}`);

    // Cleaning up after yourself is always good.
    await browser.close();
    console.log('Puppeteer closed.');
});
