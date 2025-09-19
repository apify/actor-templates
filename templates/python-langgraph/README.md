## Python LangGraph template
<!-- This is an Apify template readme -->

A template for [LangGraph](https://www.langchain.com/langgraph) projects in Python for building AI agents with [Apify Actors](https://apify.com/actors). The template provides a basic structure and an example [LangGraph](https://www.langchain.com/langgraph) [ReAct agent](https://react-lm.github.io/) that calls [Actors](https://apify.com/actors) as tools in a workflow.

## How it works

A [ReAct agent](https://react-lm.github.io/) is created and given a set of tools to accomplish a task. The agent receives a query from the user and decides which tools to use and in what order to complete the task. In this case, the agent is provided with an [Instagram Scraper Actor](https://apify.com/apify/instagram-scraper) to scrape Instagram profile posts and a calculator tool to sum a list of numbers to calculate the total number of likes and comments. The agent is configured to also output structured data, which is pushed to the dataset, while textual output is stored in the key-value store as a `response.txt` file.

## How to use

Add or modify the agent tools in the `src/tools.py` file, and make sure to include new tools in the agent tools list in `src/main.py`. Additionally, you can update the agent system prompt in `src/main.py`. For more information, refer to the [LangGraph ReAct agent documentation](https://langchain-ai.github.io/langgraph/how-tos/create-react-agent-system-prompt/) and the [LangChain tools documentation](https://python.langchain.com/docs/concepts/tools/).

For a more advanced multi-agent example, see the [Finance Monitoring Agent actor](https://github.com/apify/actor-finance-monitoring-agent) or visit the [LangGraph documentation](https://langchain-ai.github.io/langgraph/concepts/multi_agent/).

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
- [LangChain documentation](https://python.langchain.com/docs/introduction/)
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/tutorials/introduction/)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
