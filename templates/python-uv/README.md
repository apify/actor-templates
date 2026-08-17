## Python uv template

<!-- This is an Apify template readme -->

A general-purpose [Actor](https://apify.com/actors) template for Python, with the project and its dependencies managed by [uv](https://docs.astral.sh/uv/) - a fast Python package and project manager. It's a minimal starting point for any kind of Actor, for example a scraper, a browser automation, an AI agent, an MCP server, a RAG pipeline, or a standby web server.

The example code reads an input, does a little work with it, logs its progress, and stores a result in a [dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets). Replace the body of `main()` with whatever your Actor should do. The only thing this template locks in is the tooling, uv, not the use case.

## Included features

- **[uv](https://docs.astral.sh/uv/)** - a single fast tool that manages the project's Python version (`.python-version`), virtual environment (`.venv`), and dependencies (`pyproject.toml` + `uv.lock`)
- **Reproducible builds** - the `uv.lock` lockfile guarantees that the Actor's Docker image is built with exactly the dependency versions you developed against
- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes

## How it works

1. `Actor.get_input()` reads the input defined in the [input schema](https://docs.apify.com/platform/actors/development/input-schema)
2. The Actor logs the Python version it runs on (managed by uv) and greets the given name a few times
3. `Actor.push_data(...)` stores a structured result in the dataset

This is only a placeholder so the template runs out of the box. Swap it for your own logic and add the dependencies you need with `uv add`.

## Working with uv

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) first, then use it for everyday project management:

```bash
# Install the dependencies into the .venv virtual environment. uv also downloads
# the pinned Python version from .python-version if it's not installed yet.
uv sync

# Run the Actor locally (the Apify CLI automatically uses the .venv environment).
apify run

# Add or remove a dependency (updates pyproject.toml and uv.lock).
uv add <package>
uv remove <package>

# Upgrade all dependencies to the latest versions allowed by pyproject.toml.
uv lock --upgrade && uv sync
```

The Actor's `Dockerfile` installs the dependencies with `uv sync --locked --no-dev`, so the image is built with exactly the versions recorded in `uv.lock` (skipping any development-only dependencies you add under `[dependency-groups]`). Commit `uv.lock` and `.python-version` whenever they change.

## Resources

- [Apify SDK for Python: uv guide](https://docs.apify.com/sdk/python/docs/guides/uv)
- [uv: Official documentation](https://docs.astral.sh/uv/)
- [Apify SDK for Python documentation](https://docs.apify.com/sdk/python/)
- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
- [Video guide on getting data using the Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)
- A short guide on how to build Actors using code templates:

[Actor code templates](https://www.youtube.com/watch?v=u-i-Korzf8w)
