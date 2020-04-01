const Apify = require('apify');

Apify.main(async () => {
    // Apify.openRequestQueue() is a factory to get a preconfigured RequestQueue instance.
    // We add our first request to it - the initial page the crawler will visit.
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: 'https://news.ycombinator.com/' });

    // Create an instance of the PuppeteerCrawler class - a crawler
    // that automatically loads the URLs in headless Chrome / Puppeteer.
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,

        // Here you can set options that are passed to the Apify.launchPuppeteer() function.
        launchPuppeteerOptions: {
            // For example, by adding "slowMo" you'll slow down Puppeteer operations to simplify debugging
            // slowMo: 500,
        },

        // Stop crawling after several pages
        maxRequestsPerCrawl: 10,

        // This function will be called for each URL to crawl.
        // Here you can write the Puppeteer scripts you are familiar with,
        // with the exception that browsers and pages are automatically managed by the Apify SDK.
        // The function accepts a single parameter, which is an object with the following fields:
        // - request: an instance of the Request class with information such as URL and HTTP method
        // - page: Puppeteer's Page object (see https://pptr.dev/#show=api-class-page)
        handlePageFunction: async ({ request, page }) => {
            console.log(`Processing ${request.url}...`);

            // A function to be evaluated by Puppeteer within the browser context.
            const data = await page.$$eval('.athing', ($posts) => {
                const scrapedData = [];

                // We're getting the title, rank and URL of each post on Hacker News.
                $posts.forEach(($post) => {
                    scrapedData.push({
                        title: $post.querySelector('.title a').innerText,
                        rank: $post.querySelector('.rank').innerText,
                        href: $post.querySelector('.title a').href,
                    });
                });

                return scrapedData;
            });

            // Store the results to the default dataset.
            await Apify.pushData(data);

            // Find a link to the next page and enqueue it if it exists.
            const infos = await Apify.utils.enqueueLinks({
                page,
                requestQueue,
                selector: '.morelink',
            });

            if (infos.length === 0) console.log(`${request.url} is the last page!`);
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
            await Apify.pushData({
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();

    console.log('Crawler finished.');
});
