---
id: capture-screenshot
title: Capture a screenshot
---

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.

This example captures of a screenshot of a web page using Puppeteer:

{{#code}}../../examples/capture_screenshot/capture_screenshot_puppeteer.js{{/code}}

This example captures a screenshot of multiple web pages when using `PuppeteerCrawler`:

{{#code}}../../examples/capture_screenshot/capture_screenshot_puppeteer_crawler.js{{/code}}

In both examples, a `key` variable is created based on the URL of the web page. This variable is used as the key
 when saving each screenshot into a key-value store.