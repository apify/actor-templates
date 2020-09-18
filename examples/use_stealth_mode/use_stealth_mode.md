---
id: use-stealth-mode
title: use-stealth-mode
---

Stealth mode allows you to bypass anti-scraping techniques which use [browser fingerprinting](https://pixelprivacy.com/resources/browser-fingerprinting/). It overrides the attributes specified for [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) browser mode. This makes it harder to distinguish from normal or headful Chrome. 

[`PuppeteerCrawler`], which is the base for both **Web Scraper** ([apify/web-scraper]({{@link tutorials/apify_scrapers/web_scraper.md}}))
and **Puppeteer Scraper** ([apify/puppeteer-scraper]({{@link tutorials/apify_scrapers/puppeteer_scraper.md}})), supports stealth mode.

To activate stalth mode, simply set the `stealth` parameter in `launchPuppeteerOptions` to `true`.

{{#code}}use_stealth_mode.js{{/code}}

You can then specify the [`stealthOptions`](https://sdk.apify.com/docs/typedefs/stealth-options), which allow you to adapt to different anti-scraping techniques. All the options are set to `true` by default. In most cases, you can leave all the options switched on. The number of options does not affect performance.

While the default configuration will be fine in many cases, you can experiment with the settings to adapt them to your use case. 

### Single-browser instances

You can also use stealth mode in single-browser instances, when using [`Apify.launchPuppeteer`](https://sdk.apify.com/docs/typedefs/launch-puppeteer#docsNav). You can define the launch options (including [stealth options](https://sdk.apify.com/docs/typedefs/stealth-options)) as an object, then pass it to the `launchPuppeteer` function call.

```js
const puppeteerOptions = {
    headless: false,
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
};
const browser = await Apify.launchPuppeteer(puppeteerOptions);
```
