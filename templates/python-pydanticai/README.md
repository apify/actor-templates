## PydanticAI template

Start a new [AI agent](https://blog.apify.com/what-are-ai-agents/) based project in Python with our PydanticAI project template. It provides a basic structure for the [Actor](https://apify.com/actors) using the [Apify SDK](https://docs.apify.com/sdk/python/) and [PydanticAI](https://ai.pydantic.dev/), and allows you to add your own functionality with minimal setup.


## How it works

Insert your own code to `async with Actor:` block. You can use the [Apify SDK](https://docs.apify.com/sdk/python/) with any other Python library. Add or modify the agent and tools in the [agents.py](pydanticai_template/agents.py) file.


## Getting started

For complete information [see this article](https://docs.apify.com/platform/actors/development#build-actor-locally). To run the Actor use the following command:

```bash
apify run
```

## Deploy to Apify

### Connect Git repository to Apify

If you've created a Git repository for the project, you can connect to Apify:

1. Go to [Actor creation page](https://console.apify.com/actors/new)
2. Click on **Link Git Repository** button

### Push project on your local machine to Apify

You can also deploy the project from your local machine to the Apify platform without the need for the Git repository.

1. Log in to Apify. You will need to provide your [Apify API Token](https://console.apify.com/account/integrations) to complete this action.

    ```bash
    apify login
    ```

2. Deploy your Actor. This command will deploy and build the Actor on the Apify Platform. You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).

    ```bash
    apify push
    ```

## Pay Per Event

This template uses the [Pay Per Event (PPE)](https://docs.apify.com/platform/actors/publishing/monetize#pay-per-event-pricing-model) monetization model, which provides flexible pricing based on defined events.

To charge users, define events in JSON format and save them on the Apify platform. Here is an example schema with the `task-completed` event:

```json
[
    {
        "task-completed": {
            "eventTitle": "Task completed",
            "eventDescription": "Flat fee for completing the task.",
            "eventPriceUsd": 0.01
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


## Resources

To learn more about Apify, Actors and PydanticAI take a look at the following resources:

- [Apify SDK for Python documentation](https://docs.apify.com/sdk/python)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)
- [AI agent architecture](https://blog.apify.com/ai-agent-architecture)
- [What are AI agents](https://blog.apify.com/what-are-ai-agents/)
- [How to build and monetize an AI agent on Apify](https://blog.apify.com/how-to-build-an-ai-agent/)
- [PydanticAI documentation](https://ai.pydantic.dev/)
- [PydanticAI on GitHub](https://github.com/pydantic/pydantic-ai)
