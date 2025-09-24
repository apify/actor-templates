## Python CrewAI template

<!-- This is an Apify template readme -->

A template for [CrewAI](https://www.crewai.com/) projects in Python for building AI agents with [Apify Actors](https://apify.com/actors). The template provides a basic structure and an example [agent](https://docs.crewai.com/concepts/agents) that calls [Actors](https://apify.com/actors) via `ApifyActorsTool` in a workflow using the [CrewAI Apify Actors integration](https://docs.apify.com/platform/integrations/crewai).

For a detailed guide, visit the [How to build an AI agent](https://blog.apify.com/how-to-build-an-ai-agent/) article.

## How it works

An [agent](https://docs.crewai.com/concepts/agents) is created and given a set of tools to accomplish a task. The agent receives a query from the user and decides which tools to use and in what order to complete the task. In this template, the agent uses `ApifyActorsTool('apify/instagram-scraper')` from `crewai_tools` to run the [Instagram Scraper Actor](https://apify.com/apify/instagram-scraper) and analyze scraped posts. The agent produces textual output, which is saved to a dataset.

## How to use

Tools are provided via `crewai_tools` and configured in `src/main.py`. To change tools, edit the `tools` list in `src/main.py`. You can also update the agent prompts in `src/main.py`. For more information, refer to the [CrewAI agent documentation](https://docs.crewai.com/concepts/agents) and the [CrewAI tools documentation](https://docs.crewai.com/concepts/tools).

#### Pay Per Event

This template uses the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) monetization model, which provides flexible pricing based on defined events.

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

```python
await Actor.charge(event_name='task-completed')
```

This approach allows you to programmatically charge users directly from your Actor, covering the costs of execution and related services, such as LLM input/output tokens.

To set up the PPE model for this Actor:

- **Configure the OpenAI API key environment variable**: provide your OpenAI API key to the `OPENAI_API_KEY` in the Actor's **Environment variables**.
- **Configure Pay Per Event**: establish the Pay Per Event pricing schema in the Actor's **Monetization settings**. First, set the **Pricing model** to `Pay per event` and add the schema. An example schema can be found in [pay_per_event.json](.actor/pay_per_event.json).

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Key-value store](https://docs.apify.com/platform/storage/key-value-store)** - store any kind of data, such as JSON documents, images, or text files

## Resources

- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Apify Python SDK documentation](https://docs.apify.com/sdk/python/)
- [CrewAI documentation](https://docs.crewai.com/introduction)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
