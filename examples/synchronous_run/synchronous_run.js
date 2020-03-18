const Apify = require('apify');

Apify.main(async () => {
    // Launch web browser.
    const browser = await Apify.launchPuppeteer({ headless: true });

    // Load http://goldengatebridge75.org/news/webcam.html and get an IFRAME with the webcam stream
    console.log('Opening web page...');
    const page = await browser.newPage();
    await page.goto('http://goldengatebridge75.org/news/webcam.html');
    const frames = await page.frames();
    const iframeWithVideo = frames[1];

    // Wait for the webcam to load.
    console.log('Waiting for the webcam image.');
    const imageElementHandle = await iframeWithVideo.waitForSelector('.VideoColm img[src^="blob:"]');
    // Wait a little more to give the browser a chance to display the image.
    await page.waitFor(1000);

    // Get a screenshot of that image.
    const imageBuffer = await imageElementHandle.screenshot();
    console.log('Screenshot captured.');

    // Save the screenshot as the actor's output. By convention, similarly to "INPUT",
    // the actor's output is stored in the default key-value store under the "OUTPUT" key.
    await Apify.setValue('OUTPUT', imageBuffer, { contentType: 'image/jpeg' });
    console.log('Actor finished.');
});
