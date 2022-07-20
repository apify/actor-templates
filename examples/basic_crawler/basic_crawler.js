const { Actor } = require('apify');
const { BasicCrawler } = require('crawlee');

// Apify.main() function wraps the crawler logic (it is optional).
Actor.main(async () => {
    // Create a BasicCrawler - the simplest crawler that enables
    // users to implement the crawling logic themselves.
    const crawler = new BasicCrawler({
        // This function will be called for each URL to crawl.
        async requestHandler({ request, sendRequest }) {
            const { url } = request;
            console.log(`Processing ${url}...`);

            // Fetch the page HTML via Apify utils requestAsBrowser
            const { body } = await sendRequest({ url });

            // Store the HTML and URL to the default dataset.
            await Actor.pushData({
                url: request.url,
                html: body,
            });
        },
    });

    // Run the crawler and wait for it to finish.
    await crawler.run([
        { url: 'http://www.google.com/' },
        { url: 'http://www.example.com/' },
        { url: 'http://www.bing.com/' },
        { url: 'http://www.wikipedia.com/' },
    ]);

    console.log('Crawler finished.');
});
