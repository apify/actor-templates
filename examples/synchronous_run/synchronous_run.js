const Apify = require('apify');

Apify.main(async () => {
    // Launch web browser.
    const browser = await Apify.launchPuppeteer({ launchOptions: { headless: true } });
    // Load https://en.wikipedia.org and get all "Did you know" texts.
    console.log('Opening web page...');
    const page = await browser.newPage();
    await page.goto('https://en.wikipedia.org');

    // Get all "Did you know" items from the page.
    console.log('Getting "Did you know" items from the page.');
    const results = await page.$$eval(
        'div#mp-dyk > ul li',
        (nodes) => nodes.map((node) => node.innerText.replace('...', 'Did you know')),
    );
    console.log(results);

    // Save all the items to the Apify dataSet.
    await Apify.pushData(results);
    console.log('Actor finished.');

    // Close browser
    await browser.close();
});
