---
id: call-actor
title: Call actor
---

 This example demonstrates how to start an Apify actor using
[`Apify.call()`](/docs/api/apify#call) and how to call Apify API using
[`Apify.client`](/docs/api/apify#client).
The script extracts the current Bitcoin prices from [Kraken.com](https://www.kraken.com/)
 and sends them to your email using the [`apify/send-mail`](https://apify.com/apify/send-mail) actor.

 To make the example work, you'll need an [Apify Account](https://my.apify.com/).
 Go to [Account - Integrations](https://my.apify.com/account#/integrations) page to obtain your API token
 and set it to the [`APIFY_TOKEN`](/docs/guides/environment-variables#APIFY_TOKEN) environment variable, or run the script using the CLI.
 If you deploy this actor to the Apify Cloud then you can set up a scheduler for early
 morning.

 To run this example on the Apify Platform, select the `Node.js 12 + Chrome on Debian (apify/actor-node-chrome)` base image
 on the source tab of your actor configuration.


{{#code}}../../examples/call_actor/call_actor.js{{/code}}