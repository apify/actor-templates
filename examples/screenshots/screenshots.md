---
id: screenshots
title: Screenshots
---

 This example demonstrates how to read and write data to the default key-value store using
 [`Apify.getValue()`](/docs/api/apify#getValue) and [`Apify.setValue()`](/docs/api/apify#setValue).

  The script crawls a list of URLs using Puppeteer,
 captures a screenshot of each page, and saves it to the store. The list of URLs is
 provided as actor input that is also read from the store.

 In local configuration, the input is stored in the default key-value store's directory as a JSON file at
 `./apify_storage/key_value_stores/default/INPUT.json`. You need to create the file and set it with the following content:

 ```json
  { "sources": [{ "url": "https://www.google.com" }, { "url": "https://www.duckduckgo.com" }] }
 ```

 On the Apify cloud, the input can be either set manually
 in the UI app or passed as the POST payload to the
 [Run actor API call](https://apify.com/docs/api/v2#/reference/actors/run-collection/run-actor).
 For more details, see [Input and output](https://docs.apify.com/actor/run#input-and-output)
 in the Apify Actor documentation.

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` base image
 > on the source tab of your actor configuration.

{{#code}}../../examples/screenshots/screenshots.js{{/code}}
