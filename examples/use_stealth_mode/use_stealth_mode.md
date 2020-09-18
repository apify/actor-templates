---
id: use-stealth-mode
title: use-stealth-mode
---

Stealth mode allows you to bypass anti-scraping techniques which use [browser fingerprinting](https://pixelprivacy.com/resources/browser-fingerprinting/). It overrides the attributes specified for [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) browser mode, making your headless browser harder to distinguish from the full Chrome browser. 

To activate stalth mode, set the `headless` and `stealth` parameters in `launchPuppeteerOptions` to `true`.

{{#code}}use_stealth_mode.js{{/code}}

You can then specify the [`stealthOptions`](https://sdk.apify.com/docs/typedefs/stealth-options), which allow you to adapt to different anti-scraping techniques. All the options are set to `true` by default. The number of options does not affect performance.

While the default configuration will be fine in many cases, you can adapt the options to your use case. 

### Single-browser instances

You can also use stealth mode in single-browser instances when using [`Apify.launchPuppeteer`](https://sdk.apify.com/docs/typedefs/launch-puppeteer#docsNav). You can define the launch options (including [stealth options](https://sdk.apify.com/docs/typedefs/stealth-options)) as an object, then pass it to the `launchPuppeteer` function call.

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
