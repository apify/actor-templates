## Python Browser Use template

<!-- This is an Apify template readme -->

An AI agent that opens a website in a real Chrome browser, completes a task written in plain English, and stores the result as structured data. It's built with [Browser Use](https://docs.browser-use.com/). By default, the agent returns the titles and URLs of the first five posts on [Hacker News](https://news.ycombinator.com/).

## How it works

1. The Actor reads the input and checks every limit (steps, deadline, number of results) again in code, so API calls that skip input validation can't raise them.
2. It launches one Chrome browser, routed through [Apify Proxy](https://docs.apify.com/platform/proxy) when enabled.
3. The browser opens `startUrl`, and a single Browser Use agent follows the `task` instruction. It returns at most `maxItems` items that match the `Items` Pydantic model in [`my_actor/main.py`](my_actor/main.py).
4. If the final page has exactly one link with an item's title, the Actor stores that link's URL, because models sometimes shorten or mistype long URLs. Other items keep the URL the model returned.
5. Each item is saved to the default dataset, and a run summary is written to the `OUTPUT` record in the key-value store. The browser is closed even if the run fails.

## Input

| Field                | Default                         | Purpose                                             |
| -------------------- | ------------------------------- | --------------------------------------------------- |
| `startUrl`           | `https://news.ycombinator.com/` | Page the agent opens                                |
| `task`               | post titles and URLs            | Instruction whose result must fit the `Items` model |
| `modelName`          | `gpt-4.1-mini`                  | OpenAI model that drives the agent                  |
| `maxItems`           | `5`                             | Maximum number of items and dataset rows            |
| `maxSteps`           | `8`                             | Maximum number of agent steps (and LLM calls)       |
| `deadlineSecs`       | `240`                           | Time limit for the whole agent run                  |
| `actionDelaySecs`    | `0.5`                           | Minimum delay between browser actions               |
| `proxyConfiguration` | Apify Proxy enabled             | Proxy for the browser                               |

## Output

Each dataset item looks like this:

```json
{
    "rank": 1,
    "title": "Show HN: An example project",
    "url": "https://example.com/project"
}
```

The `OUTPUT` record contains `framework`, `status`, `model`, `startUrl`, `itemCount`, and `elapsedSecs`. When a run fails, it also contains a short `error` message.

## LLM provider

The agent calls the [OpenAI API](https://platform.openai.com/) with your own key. On the Apify platform, add your key as the `OPENAI_API_KEY` secret in the Actor's **Environment variables**. For local runs, export `OPENAI_API_KEY` in your shell.

## Modifying the agent

- To extract something else, change the `task` input together with the `Item` and `Items` models in [`my_actor/main.py`](my_actor/main.py), the dataset schema in [`.actor/dataset_schema.json`](.actor/dataset_schema.json), and the output example above.
- To change the input limits, update both [`.actor/input_schema.json`](.actor/input_schema.json) and [`my_actor/config.py`](my_actor/config.py).
- The agent can't use Browser Use's file-system, `extract`, page-query (`find_elements`, `find_text`, `search_page`), `evaluate`, or screenshot actions (see `EXCLUDED_ACTIONS` in [`my_actor/main.py`](my_actor/main.py)), so it returns its result through `done`. On its last step it can only call `done`, so keep `deadlineSecs` long enough for `maxSteps` steps.
- The template runs one agent with one browser. If you add more agents running at the same time, give each one its own `Browser` and profile directory.
- Browser Use installs its own SIGINT and SIGTERM handlers during a run. [`my_actor/compat.py`](my_actor/compat.py) keeps them with the Actor: it passes `enable_signal_handler=False` on Browser Use 0.12.6 and later, and replaces the handler with a no-op on older releases.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Apify Proxy](https://docs.apify.com/platform/proxy)** - route the browser through datacenter or residential proxies
- **[Browser Use](https://docs.browser-use.com/)** - AI agent framework that controls a real browser

## Getting started

To run the Actor locally, you need Google Chrome or Chromium installed. The Docker image used on the Apify platform already includes Chrome. Set your OpenAI key and start the Actor:

```bash
export OPENAI_API_KEY=sk-...
apify run
```

If you aren't logged in to Apify, disable Apify Proxy in the input (`"proxyConfiguration": {"useApifyProxy": false}`).

For complete information, [see this article](https://docs.apify.com/platform/actors/development#build-actor-locally).

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

## Resources

- [What are AI agents?](https://blog.apify.com/what-are-ai-agents/)
- [How to build and monetize an AI agent on Apify](https://blog.apify.com/how-to-build-an-ai-agent/)
- [Browser Use integration guide for the Apify SDK](https://docs.apify.com/sdk/python/docs/guides/browser-use)
- [Apify Python SDK documentation](https://docs.apify.com/sdk/python/)
- [Browser Use documentation](https://docs.browser-use.com/)
- [Browser Use on GitHub](https://github.com/browser-use/browser-use)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
