---
id: synchronous-run
title: Synchronous run
---

 This example shows a quick actor that has a run time of just a few seconds.
 It opens a [web page](https://en.wikipedia.org) (the Wikipedia home page), which contains a list of "Did you know"
 texts that change daily. The actor scrapes all the "Did you know" items and saves them to the default dataset.

 This actor can be invoked synchronously using a single HTTP request to directly obtain its output
  as a response, using the
 [Run actor synchronously](https://apify.com/docs/api/v2#/reference/actors/run-actor-synchronously/without-input)
 Apify API endpoint.

  > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
  >base image on the **Source** tab when configuring the actor.

{{#code}}synchronous_run.js{{/code}}
