const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('my-list', [
        { url: 'https://news.ycombinator.com/' },
    ]);

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        launchPuppeteerOptions: {
            headless: true,
            stealth: true,
            useChrome: true,
            // Set stealth options
            stealthOptions: {
                addPlugins: false,
                emulateWindowFrame: false,
                emulateWebGL: false,
                emulateConsoleDebug: false,
                addLanguage: false,
                hideWebDriver: true,
                hackPermissions: false,
                mockChrome: false,
                mockChromeInIframe: false,
                mockDeviceMemory: false,
            },
        },
        handlePageFunction: async ({ request, page }) => {
            const data = await page.$$eval('.athing', $posts => {
                const scrapedData = [];
                // Get the title of each post on Hacker News
                $posts.forEach($post => {
                    const title = $post.querySelector('.title a').innerText;
                    scrapedData.push({
                        title: `The title is: ${title}`,
                    });
                });
                return scrapedData;
            });
            // Save the data array to the Apify dataSet
            await Apify.pushData(data);
        },
    });
    await crawler.run();
});
