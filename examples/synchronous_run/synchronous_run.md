---
id: synchronous-run
title: Synchronous run
---

 This example shows a quick actor that has a run time of just a few seconds.
 It opens a [web page](http://goldengatebridge75.org/news/webcam.html)
 that contains a webcam stream from the Golden Gate Bridge, takes a screenshot of the page and saves it as output.

 This actor can be invoked synchronously using a single HTTP request to directly obtain its output
  as a response, using the
 [Run actor synchronously](https://apify.com/docs/api/v2#/reference/actors/run-actor-synchronously/without-input)
 Apify API endpoint. The example is also shared as the
 [`apify/example-golden-gate-webcam`](https://apify.com/apify/example-golden-gate-webcam)
 actor in the Apify library, so you can test it directly there simply by sending a POST request to
 ```http
 https://api.apify.com/v2/acts/apify~example-golden-gate-webcam/run-sync?token=[YOUR_API_TOKEN]
 ```

 To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` base image
 on the source tab of your actor configuration.

{{#code}}../../examples/synchronous_run/synchronous_run.js{{/code}}
