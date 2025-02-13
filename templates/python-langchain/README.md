## Python LangChain template

A template for [LangChain](https://www.langchain.com/langgraph) projects in Python for building AI agents with [Apify Actors](https://apify.com/actors). The template provides a basic structure and an example [LangGraph](https://www.langchain.com/langgraph) ReAct agent that calls [Actors](https://apify.com/actors) as tools in a workflow.

## How to use

Install the [uv](https://docs.astral.sh/uv/) package manager (for other installation methods [see](https://docs.astral.sh/uv/getting-started/installation/)):

```bash
pipx install uv
```

Install dependencies:

```bash
uv sync
```




## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Key-value store](https://docs.apify.com/platform/storage/key-value-store)** - store any kind of data, such as JSON documents, images, or text files
- **[LangChain](https://apify.com/docs/actor/langchain)** - tools to connect language models with external data sources
- **[LangGraph](https://www.langchain.com/langgraph)** - a framework for added control in agent workflows

## Resources

- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Apify Python SDK documentation](https://docs.apify.com/sdk/python/)
- [LangChain documentation](https://python.langchain.com/docs/introduction/)
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/tutorials/introduction/)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
