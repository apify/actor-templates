## Python CrewAI template

A template for [CrewAI](https://www.crewai.com/) projects in Python for building AI agents with [Apify Actors](https://apify.com/actors). The template provides a basic structure and an example [agent](https://docs.crewai.com/concepts/agents) that calls [Actors](https://apify.com/actors) as tools in a workflow.

## How it works

An [agent](https://docs.crewai.com/concepts/agents) is created and given a set of tools to accomplish a task. The agent receives a query from the user and decides which tools to use and in what order to complete the task. In this case, the agent is provided with an [Instagram Scraper Actor](https://apify.com/apify/instagram-scraper) to scrape Instagram profile posts and a calculator tool to sum a list of numbers to calculate the total number of likes and comments. The agent is configured to also output structured data, which is pushed to the dataset, while textual output is stored in the key-value store as a `response.txt` file.

## How to use

Add or modify the agent tools in the `src/tools.py` file, and make sure to include new tools in the agent tools list in `src/main.py`. Additionally, you can update the agent prompts in `src/main.py`. For more information, refer to the [CrewAI agent documentation](https://docs.crewai.com/concepts/agents) and the [CrewAI tools documentation](https://docs.crewai.com/concepts/tools).

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
