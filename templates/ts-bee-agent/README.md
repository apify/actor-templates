## TypeScript Bee Agent Framework Template

A template for [Bee Agent Framework](https://i-am-bee.github.io/bee-agent-framework/#/) projects in TypeScript for building AI agents with [Apify Actors](https://apify.com/actors). This template offers a structured setup and an example [ReAct agent](https://react-lm.github.io/) utilizing [Instagram Scraper](https://apify.com/apify/instagram-scraper) and a calculator tool in a workflow context.

### How it Works

A [ReAct agent](https://react-lm.github.io/) is employed, equipped with tools to respond to user queries. The agent processes a user query, decides on the tools to use, and in what sequence, to achieve the desired outcome. Here, the agent leverages an Instagram Scraper to fetch posts from a profile and a calculator tool to compute sums, like totaling likes or comments. The agent produces structured data which is saved to a dataset, and textual responses are stored in the key-value store as `response.txt`.

### How to Use

Add or modify tools in the `src/tool_calculator.ts` and `src/tool_instagram.ts` files, and ensure they are included in the agent's tool list in `src/main.ts`. Additionally, you can update the agent's system prompt or other configurations within `src/main.ts`. For more information, refer to the [Bee Agent documentation](https://i-am-bee.github.io/bee-agent-framework/#/agents?id=bee-agent).

### Included Features

- **[Apify SDK](https://docs.apify.com/sdk/js/)** for JavaScript - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in JavaScript
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)** - store structured data where each object stored has the same attributes
- **[Key-value store](https://docs.apify.com/platform/storage/key-value-store)** - store any kind of data, such as JSON documents, images, or text files
- **[OpenAI](https://openai.com/)** - a powerful language model
- **[Bee Agent Framework](https://i-am-bee.github.io/bee-agent-framework/#/)** - framework for creating advanced AI agents with control over workflows

### Resources

- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [TypeScript tutorials in Academy](https://docs.apify.com/academy/node-js)
- [Apify SDK documentation](https://docs.apify.com/sdk/js/)
- [Bee Agent Framework documentation](https://i-am-bee.github.io/bee-agent-framework/#/)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
