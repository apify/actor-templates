---
id: call-actor
title: Call actor
---

 This example demonstrates how to start an Apify actor using
[`Apify.call()`](/docs/api/apify#call) and how to call the Apify API using
[`Apify.client`](/docs/api/apify#client).
The script extracts the current Bitcoin prices from [Kraken.com](https://www.kraken.com/)
 and sends them to your email using the [`apify/send-mail`](https://apify.com/apify/send-mail) actor.

 To make the example work, you'll need an [Apify account](https://my.apify.com/).
 Go to the [Account - Integrations](https://my.apify.com/account#/integrations) page to obtain your API token
 and set it to the [`APIFY_TOKEN`](/docs/guides/environment-variables#APIFY_TOKEN) environment variable, or run the script using the Apify CLI. If you deploy this actor to the Apify Cloud, you can do things like set up a scheduler to run your actor early in the morning.
 
 To see what other actors are available, visit the [Apify Store](https://apify.com/store).
 
 > To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` 
 >base image on the **Source** tab when configuring the actor.


{{#code}}../../examples/call_actor/call_actor.js{{/code}}
