## Langgraph.js agent template

> [LangGraph](https://langchain-ai.github.io/langgraphjs/) is a library for building stateful, multi-actor applications with LLMs, used to create agent and multi-agent workflows.

The template provides a basic structure and an example of [LangGraph](https://www.langchain.com/langgraph) [ReAct agent](https://react-lm.github.io/) that answers questions using web search.

## How it works

The LangGraph agent does the following:

1. Determines whether to answer questions using internal knowledge or by searching the web.
2. If web search is needed, it uses the [RAG Web Browser](https://apify.com/apify/rag-web-browser) to gather relevant data from websites.
3. Utilizes the gathered data to answer the question using the OpenAI model.

The agent has one tool `webSearchTool`, defined in `src/tools.js`, which it uses to search the web for relevant data.

### Sample query:
- How to build LangGraph agent at Apify platform?

## Before you start

To run this template locally or on the Apify platform, you need:

- An [Apify account](https://console.apify.com/) and an [Apify API token](https://docs.apify.com/platform/integrations/api#api-token).
- An [OpenAI](https://openai.com/) account and API key.

## Resources

Useful resources to help you get started:

- [Apify Actors](https://docs.apify.com/platform/actors)
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/tutorials/introduction/)
- [LangGraph examples](https://github.com/bracesproul/langgraphjs-examples/tree/main)
- [LangGraph with Apify (Python)](https://docs.apify.com/platform/integrations/langgraph)
- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [11 AI agent use cases on Apify](https://blog.apify.com/ai-agent-use-cases/)

Additional material:
[Web Scraping Data for Generative AI](https://www.youtube.com/watch?v=8uvHH-ocSes)
