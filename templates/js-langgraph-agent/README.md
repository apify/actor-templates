<!-- This is an Apify template readme -->
## LangGraph.js agent template

> [LangGraph](https://langchain-ai.github.io/langgraphjs/) is a library for building stateful, multi-actor applications with LLMs, used to create agent and multi-agent workflows.

This template provides a basic structure and an example of a [LangGraph](https://www.langchain.com/langgraph) [ReAct agent](https://react-lm.github.io/) that answers questions using web search.

## How it works

The LangGraph agent follows these steps:

1. Determines whether to answer questions using internal knowledge or by searching the web.
2. If a web search is needed, it uses the [RAG Web Browser](https://apify.com/apify/rag-web-browser) to gather relevant data from websites.
3. Utilizes the gathered data to generate an answer using the OpenAI model.

In LangGraph.js, agents use **tools**, which are functions designed to perform specific tasks.
This agent has one tool, `webSearchTool`, defined in `src/tools.js`, which allows it to search the web for relevant data.

### Sample query

- How to build a LangGraph agent on the Apify platform?

## Before you start

To run this template locally or on the Apify platform, you need:

- An [Apify account](https://console.apify.com/) and an [Apify API token](https://docs.apify.com/platform/integrations/api#api-token).
- An [OpenAI](https://openai.com/) account and API key.

When running the agent locally, set the OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your-openai-api-key
```

When running the agent on the Apify platform, set the OpenAI API key in the environment variables of the Actor.
To do this, go to **Actor settings** → **Source** → **Code**, then scroll down to the **Environment variables** tab and add a new variable named `OPENAI_API_KEY` with your OpenAI API key.

## Monetization

This template uses the [Pay Per Event](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) (PPE) monetization model, which provides flexible pricing based on defined events.

To charge users, define events in JSON format and save them on the Apify platform. Here is an example of [pay_per_event.json](.actor/pay_per_event.json) with the `task-completed` event:

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

```javascript
await Actor.charge({ eventName: 'task-completed' });
```

This approach allows you to programmatically charge users directly from your Actor, covering the costs of execution and related services, such as LLM input/output tokens.

## Resources

Useful resources to help you get started:

- [Apify Actors](https://docs.apify.com/platform/actors)
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/tutorials/introduction/)
- [LangGraph examples](https://github.com/bracesproul/langgraphjs-examples/tree/main)
- [LangGraph with Apify (Python)](https://docs.apify.com/platform/integrations/langgraph)
- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [11 AI agent use cases on Apify](https://blog.apify.com/ai-agent-use-cases/)
- [Pay-per-event Monetization](https://docs.apify.com/sdk/js/docs/next/guides/pay-per-event)
- [Web Scraping Data for Generative AI](https://www.youtube.com/watch?v=8uvHH-ocSes)
