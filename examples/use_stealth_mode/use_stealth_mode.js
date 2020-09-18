const Apify = require('apify');

Apify.main(async () => {
    const requestList = await Apify.openRequestList('my-list', [
        { url: 'http://www.example.com/page-1' },
        { url: 'http://www.example.com/page-2' },
        { url: 'http://www.example.com/page-3' },
    ]);

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        launchPuppeteerOptions: {    
            headless: true,    
            stealth: true,    
            useChrome: true,    
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
        handlePageFunction: async ({ request, $ }) => {
            const title = $('title').text();
            console.log(`The title of "${request.url}" is: ${title}.`);
        },
    });
    await crawler.run();
})
