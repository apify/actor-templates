const Apify = require('apify');

Apify.main(async () => {
    // Launch the web browser.
    const browser = await Apify.launchPuppeteer();

    // Create and navigate new page
    console.log('Open target page');
    const page = await browser.newPage();
    await page.goto('https://github.com/search/advanced');

    // Fill form fields and select desired search options
    console.log('Fill in search form');
    await page.type('#adv_code_search input.js-advanced-search-input', 'apify-js');
    await page.type('#search_from', 'apifytech');
    await page.type('#search_date', '>2015');
    await page.select('select#search_language', 'JavaScript');

    // Submit the form and wait for full load of next page
    console.log('Submit search form');
    await Promise.all([
        page.waitForNavigation(),
        page.click('#adv_code_search button[type="submit"]')
    ]);

    // Obtain and print list of search results
    const results = await page.$$eval('div.codesearch-results ul.repo-list li div.mt-n1 div.f4.text-normal a', nodes => nodes.map(node => ({
        url: node.href,
        name: node.innerText
    })));
    console.log('Results:', results);

    // Store data in default dataset
    await Apify.pushData(results);
});