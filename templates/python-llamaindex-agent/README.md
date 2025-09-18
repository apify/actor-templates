<!-- This is an Apify template readme -->
## Python LlamaIndex Agent Template

Create a new [AI Agent](https://blog.apify.com/what-are-ai-agents) with [LlamaIndex](https://www.llamaindex.ai/) using this template.
It provides a basic structure for the Agent with the Apify SDK and allows you to easily add your own functionality.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python.
- **[Input Schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input.
- **[LlamaIndex](https://github.com/run-llama/llama_index)** - a framework for building LLM-powered agents using your data.
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - a storage solution for structured data where each object stored shares the same attributes.

## How it works

The Agent has two main tools:

1. `call_contact_details_scraper` - Calls the [Contact Details Scraper](https://apify.com/vdrmota/contact-info-scraper) to scrape contact details from websites.
2. `summarize_contact_information` - Summarizes the collected contact details.

Given a user query with a URL, the Agent uses the Contact Details Scraper to retrieve the contact information and optionally summarizes the data.
The Agent can decide how to handle the data—whether to process it further or skip summarization if it's not necessary.

### Sample queries:

- Find contact details for `apify.com` and provide raw results.
- Find contact details for `apify.com` and summarize them.

## Before you start

To run this template locally or on the Apify platform, you need:

- An [Apify account](https://console.apify.com/) and an [Apify API token](https://docs.apify.com/platform/integrations/api#api-token).
- An [OpenAI](https://openai.com/) account and API key.

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
- [LlamaIndex agent](https://docs.llamaindex.ai/en/stable/use_cases/agents/)
- [Building a basic agent](https://docs.llamaindex.ai/en/stable/understanding/agent/)
- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [11 AI agent use cases on Apify](https://blog.apify.com/ai-agent-use-cases/)

Additional material:
[Web Scraping Data for Generative AI](https://www.youtube.com/watch?v=8uvHH-ocSes)
