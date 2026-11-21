## Server Actor template with Express

<!-- This is an Apify template readme -->

A template for an API that runs as a [Server Actor](https://docs.apify.com/actors/development/programming-interface/server-actors) (formerly Actor Standby mode). It is written in TypeScript with [Express](https://expressjs.com/) and the [Apify SDK](https://docs.apify.com/sdk/js/). It charges the user for each request, and the same code works whether the Actor is single-tenant or multi-tenant.

## Included features

- **Express server** that listens on the port from the Actor configuration and answers the readiness probe
- **Charging for each request** with `Actor.charge()` and the request ID that the platform sends
- **Run pool detection**, so the Actor knows which type of user a run serves
- **Endpoint discovery** at `GET /` and an OpenAPI spec at `GET /openapi.json`

## How it works

| File                  | What it does                                                                            |
| --------------------- | --------------------------------------------------------------------------------------- |
| `src/main.ts`         | Starts the Actor, finds the run pool, and starts the server                             |
| `src/app.ts`          | Defines the endpoints and charges each request                                          |
| `src/run_pool.ts`     | Reads the pool of the current run and explains who pays in each pool                    |
| `.actor/openapi.json` | Describes the endpoints for the **Server** tab in Apify Console and for `/openapi.json` |

The example endpoint is `GET /greet?name=World`. Replace it with the work your Actor does for each request, and describe the new endpoint in `.actor/openapi.json`. The list at `GET /` is built from that file.

## Charge for a request

The platform adds an `X-Actor-Request-ID` header to every request it forwards to a Server Actor. The template passes it to `Actor.charge()` as `requestId`:

```ts
await Actor.charge({
    eventName: 'api-request',
    requestId,
    idempotencyKey: `${requestId}:api-request`,
});
```

- In a multi-tenant Server Actor, one run serves many users, and the request ID tells the platform which user to charge. A charge without it fails.
- A single-tenant Server Actor ignores the request ID, so you can switch the tenancy without changing the code.
- Charge before you send the response. After the request ends, its ID stops working.
- Requests you send to a local run have no request ID, and locally `Actor.charge()` charges nothing.

The `api-request` event and its price are in `.actor/pay_per_event.json`. Configure the same event in the Actor's pay-per-event pricing in Apify Console.

This needs a version of the SDK where `Actor.charge()` accepts `requestId`. The first one is `apify` 3.7.3-beta.98.

## Run pools

A multi-tenant Server Actor runs in your account, and the platform keeps a separate pool of runs for paying users, free users, and your own requests. The template reads the pool once at startup, logs it, and returns it from `GET /`. The table in `src/run_pool.ts` shows who pays for events and platform usage in each pool.

To identify a user, read the `X-Apify-User-ID` header. In a multi-tenant run, it is the only way to tell users apart.

## Run locally

```bash
npm install
npm run start:dev
```

The server listens on port 4321:

```bash
curl http://localhost:4321/
curl "http://localhost:4321/greet?name=Apify"
```

## Resources

- [Develop Server Actors](https://docs.apify.com/actors/development/programming-interface/server-actors)
- [Monetize multi-tenant Server Actors](https://docs.apify.com/actors/monetize/server-actors)
- [Actor web server schema](https://docs.apify.com/actors/development/actor-definition/web-server-schema)
- [Pay-per-event pricing model](https://docs.apify.com/actors/monetize/pay-per-event)
