## Python Smolagents template

An AI news aggregator that fetches and summarizes the latest news based on user-defined interests using DuckDuckGo search and OpenAI models, built with Python Smolagents.

## How it works

This Actor works as an AI-powered news aggregator:
- The user provides a list of topics they are interested in.
- The Actor searches for relevant news articles using DuckDuckGo.
- The retrieved articles are processed and summarized using an OpenAI model.
- The final summarized news output is stored in a dataset.

## How to use

1. Provide input: Define your topics of interest by setting the `interests` field in the Actor input.
2. Choose an OpenAI model: Specify the OpenAI model to use in the model field.
3. Run the Actor: Execute the Actor on the Apify platform or locally.
4. Retrieve results: The summarized news articles will be available in the default dataset.

## Modifying the Agent

- You can modify the `src/main.py` file to adjust the query structure or change how the results are summarized.
- If needed, you can replace the `DuckDuckGo` search tool with another search API.
- Update the prompt used for summarization to fine-tune the output.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Smolagents](https://huggingface.co/docs/smolagents/index)** - lightweight AI agent framework

## Resources

- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Apify Python SDK documentation](https://docs.apify.com/sdk/python/)
- [Smolagents documentation](https://huggingface.co/docs/smolagents/index)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
