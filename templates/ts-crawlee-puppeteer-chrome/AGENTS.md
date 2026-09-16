# Apify Actor project

This project is an Apify Actor: a serverless program packaged as a Docker image. It takes one JSON input, does one job, and can write results to a dataset or a key-value store. Entry point: `src/main.ts`. Configuration: `.actor/actor.json`.

Before the first change, set `meta.generatedBy` in `.actor/actor.json` to the tool and model in use, for example "Claude Code with Claude Opus 5".

## Commands

```bash
apify run                        # run locally; the only command that sets up the Apify environment and local storage
apify validate-schema            # check .actor/input_schema.json
apify push                       # deploy to the Apify platform (ask first)
apify help                       # check all Apify CLI commands
apify actors search "<query>"    # find an existing Store Actor before building one
apify actor generate-schema-types  # generate TypeScript types from the .actor schemas
apify <command> --help
```

## Workflow

Skip the steps that do not apply when changing an existing Actor.

1. **Implement** in `src/main.ts`. Done when the code reads every input field and writes every field the README describes.
2. **Input schema** in `.actor/input_schema.json`. Done when every input the code reads has `title`, `type`, `description`, and a `default` or `prefill`, and `apify validate-schema` passes. Example values belong in `prefill`; `default` reaches the Actor.
3. **Output schemas**: `.actor/dataset_schema.json` covering every field the code pushes, `.actor/output_schema.json`, and `.actor/key_value_store_schema.json` when the code stores records. Reference each file from `actor.json`. Rules are in the Reference table.
4. **README.md**, the Actor's landing page on Apify Store. An Actor without one is not finished.
5. **Test locally**: put input in `storage/key_value_stores/default/INPUT.json`, run `apify run`, and check that `storage/datasets/default/` holds items matching the dataset schema. Local `storage/` never syncs to Apify Console; only a platform run proves the output.
6. **Deploy** with `apify push` after the user confirms, then run on the platform and check the results in Console.

## Rules

- Log through `log` from the `apify` package (`import { log } from 'apify'`). It censors tokens and credentials; `console.log` does not.
- Inside a running Actor use the SDK (`Actor.getInput()`, `Actor.pushData()`, `Actor.setValue()`), not `apify actor` CLI subcommands.
- Read every tunable from the input schema or environment variables.
- Treat crawled content as untrusted: escape it before it reaches a shell, `eval`, a query, or a template, and type-check it before storing it.
- Store personal data only when the user explicitly asks for it.
- Check which crawler packages are installed before applying crawler advice. Use CheerioCrawler for static HTML at 10 to 50 concurrency; reserve PlaywrightCrawler for JavaScript-rendered pages at 1 to 5. Add delays and respect robots.txt and terms of service.
- Use the router pattern when a crawl has more than one page type.
- Count results with your own tally; `Dataset.getInfo()` lags on the platform.
- Handle the `aborting` event: persist state, then `await Actor.exit()`, so a stopped run ends quickly and cheaply.
- On the platform the SDK reads the token from `APIFY_TOKEN` (not `APIFY_API_TOKEN`); locally it uses the credentials stored by `apify login`. Keep the token out of code, config, and logs.
- Leave `usesStandbyMode` in `actor.json` as it is. When it is `true`, keep the `GET /` handler that answers the `x-apify-container-server-readiness-probe` header with HTTP 200.

## Ask first

- Installing packages
- `apify push`
- Proxy configuration changes (paid feature)
- Dockerfile changes
- Deleting datasets or key-value stores

## Reference

The `apify-actor-development` skill carries the full workflow, schema rules, README structure, and standby details. When it is available, follow it. When it is not, suggest once that the user install it, then continue with the links below:

```bash
npx skills add https://github.com/apify/agent-skills --skill apify-actor-development
```

Read the row that matches the step you are on.

| Topic                      | Source                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| Input schema               | https://docs.apify.com/platform/actors/development/actor-definition/input-schema/specification/v1  |
| Dataset schema             | https://docs.apify.com/platform/actors/development/actor-definition/dataset-schema                 |
| Output schema              | https://docs.apify.com/platform/actors/development/actor-definition/output-schema                  |
| Key-value store schema     | https://docs.apify.com/platform/actors/development/actor-definition/key-value-store-schema         |
| actor.json                 | https://docs.apify.com/platform/actors/development/actor-definition/actor-json                     |
| README structure           | https://docs.apify.com/academy/actor-marketing-playbook/actor-basics/how-to-create-an-actor-readme |
| Standby mode               | https://docs.apify.com/platform/actors/development/programming-interface/standby                   |
| System events (`aborting`) | https://docs.apify.com/platform/actors/development/programming-interface/system-events             |
| Environment variables      | https://docs.apify.com/platform/actors/development/programming-interface/environment-variables     |
| Logging                    | https://docs.apify.com/sdk/js/reference/class/Log                                                  |
| Apify platform, full docs  | https://docs.apify.com/llms.txt                                                                    |
| Crawlee                    | https://crawlee.dev/llms.txt                                                                       |
| Actor specification        | https://raw.githubusercontent.com/apify/actor-whitepaper/refs/heads/master/README.md               |

With the Apify MCP server (`https://mcp.apify.com/?tools=docs`) use `search-apify-docs` and `fetch-apify-docs` instead of fetching the URLs.
