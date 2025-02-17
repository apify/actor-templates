## Python LlamaIndex Agent Template

Create a new [AI Agent](https://blog.apify.com/what-are-ai-agents) with [LlamaIndex](https://www.llamaindex.ai/) with this template.
It provides a basic structure for the Agent with Apify SDK and allows you to easily add your own functionality.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[LlamaIndex](https://github.com/run-llama/llama_index)** - a framework for building LLM-powered agents over your data
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes

## How it works

The Agent has two tools:

- `call_contact_details_scraper` - calls [Contact Details Scraper](https://apify.com/apify/contact-details-scraper)** and scrape contact details from websites
- `summarize_contact_information` - a tool for summarizing the contact details

Given user query with URL, it searches contact using Contact Details Scraper and then summarizes the data.
The Agent can decide what to do with the data, for example, it can skip summarization if not needed.

Sample queries:
- Find contact details for `apify.com` and provide raw results
- Find contact details for `apify.com` and summarize them


## Before you start

To be able to run this template both locally and on the Apify platform, you need to:

- Have an [Apify account](https://console.apify.com/) and [Apify Token](https://docs.apify.com/platform/integrations/api#api-token)
- Have an [OpenAI](https://openai.com/) account and an API key.

## Resources

- [Apify Actors](https://docs.apify.com/platform/actors)
- [LlamaIndex Agent](https://docs.llamaindex.ai/en/stable/use_cases/agents)
- [Building a basic agent](https://docs.llamaindex.ai/en/stable/understanding/agent/)
- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [11 AI agent use cases (on Apify)](https://blog.apify.com/ai-agent-use-cases/)

[Web Scraping Data for Generative AI](https://www.youtube.com/watch?v=8uvHH-ocSes)
