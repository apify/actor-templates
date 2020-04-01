---
id: puppeteer-with-proxy
title: Puppeteer with proxy
---

 This example demonstrates how to load pages in headless Chrome / Puppeteer
 over [Apify Proxy](https://docs.apify.com/proxy).
 To make it work, you'll need an Apify account with access to the proxy.
 The proxy password is available on the [Proxy](https://my.apify.com/proxy) page in the app.
 Just set it to the [`APIFY_PROXY_PASSWORD`](../guides/environment-variables#APIFY_PROXY_PASSWORD)
 environment variable or run the script using the CLI.

 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.


{{#code}}puppeteer_with_proxy.js{{/code}}
