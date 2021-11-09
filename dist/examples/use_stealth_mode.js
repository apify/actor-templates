const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('start-urls', ['https://news.ycombinator.com/']);

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        launchContext: {
            useChrome: true,
            stealth: true,
            launchOptions: {
                headless: true,
            },
            // You can override default stealth options
            // stealthOptions: {
            //     addLanguage: false,
            // },
        },
        handlePageFunction: async ({ page }) => {
            const data = await page.$$eval('.athing', ($posts) => {
                const scrapedData = [];
                // Get the title of each post on Hacker News
                $posts.forEach(($post) => {
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
