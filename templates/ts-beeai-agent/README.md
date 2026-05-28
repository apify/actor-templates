## TypeScript BeeAI agent Template

<!-- This is an Apify template readme -->

A template for [BeeAI agent](https://beeai.dev/) projects in TypeScript for building AI agents with [Apify Actors](https://apify.com/actors). This template offers a structured setup and an example [ReAct agent](https://react-lm.github.io/) utilizing [Instagram Scraper](https://apify.com/apify/instagram-scraper) and a calculator tool in a workflow context.

### How it Works

A [ReAct agent](https://react-lm.github.io/) is employed, equipped with tools to respond to user queries. The agent processes a user query, decides on the tools to use, and in what sequence, to achieve the desired outcome. Here, the agent leverages an Instagram Scraper to fetch posts from a profile and a calculator tool to compute sums, such as totaling likes or comments. The agent produces textual and structured output, which is saved to a dataset.

### LLM provider

The agent talks to its LLM through the [Apify OpenRouter proxy](https://apify.com/apify/openrouter) — an OpenAI-compatible endpoint at `https://openrouter.apify.actor/api/v1` that fronts the full [OpenRouter](https://openrouter.ai) model catalog. Token usage is billed against the user's Apify account (pay-per-event), so **no `OPENAI_API_KEY` or any other provider API key is required**. The Actor authenticates with the proxy using the `APIFY_TOKEN` that the platform injects into every run automatically.

If you'd rather call OpenAI / Anthropic / etc. directly with your own key, swap the `OpenAIChatModel` configuration in `src/main.ts` for a different `baseURL` / `apiKey` / provider adapter — see the [BeeAI backend docs](https://framework.beeai.dev/modules/backend).

### How to Use

Add or modify tools in `src/tools/calculator.ts` and `src/tools/instagram.ts`, and register them in the agent's tool list in `src/main.ts`. You can also adjust the agent's system prompt or other configuration in `src/main.ts`. For more details, see the [BeeAI framework agents documentation](https://framework.beeai.dev/modules/agents).

#### Pay Per Event

This template uses the [Pay Per Event](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) (PPE) monetization model, which provides flexible pricing based on defined events.

To charge users, define events in JSON format and save them on the Apify platform. Here is an example schema with the `task-completed` event:

```json
[
    {
        "task-completed": {
            "eventTitle": "Task completed",
            "eventDescription": "Cost per query answered.",
            "eventPriceUsd": 0.1
        }
    }
]
```

In the Actor, trigger the event with:

```typescript
await Actor.charge({ eventName: 'task-completed' });
```

This approach allows you to programmatically charge users directly from your Actor, covering the costs of execution and related services, such as LLM input/output tokens.

To set up the PPE model for this Actor:

- **Configure Pay Per Event**: establish the Pay Per Event pricing schema in the Actor's **Monetization settings**. First, set the **Pricing model** to `Pay per event` and add the schema. An example schema can be found in [pay_per_event.json](.actor/pay_per_event.json).

No provider API key (e.g. `OPENAI_API_KEY`) needs to be configured — LLM costs are billed through the Apify OpenRouter proxy to the user running the Actor.

### Included Features

- **[Apify SDK](https://docs.apify.com/sdk/js/)** for JavaScript - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in JavaScript
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)** - store structured data where each object stored has the same attributes
- **[Key-value store](https://docs.apify.com/platform/storage/key-value-store)** - store any kind of data, such as JSON documents, images, or text files

### Resources

- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [TypeScript tutorials in Academy](https://docs.apify.com/academy/node-js)
- [Apify SDK documentation](https://docs.apify.com/sdk/js/)
- [BeeAI framework documentation](https://framework.beeai.dev/introduction/welcome)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
