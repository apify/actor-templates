## Python uv template

<!-- This is an Apify template readme -->

A template for [web scraping](https://apify.com/web-scraping) data from a single web page in Python, with the project and its dependencies managed by [uv](https://docs.astral.sh/uv/) - an extremely fast Python package and project manager. The URL of the web page is passed in via input, which is defined by the [input schema](https://docs.apify.com/platform/actors/development/input-schema). The template uses [HTTPX](https://www.python-httpx.org) to get the HTML of the page and [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) to parse the data from it. The data are then stored in a [dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets) where you can easily access them.

The scraped data in this template are page headings, but you can easily edit the code to scrape whatever you want from the page.

## Included features

- **[uv](https://docs.astral.sh/uv/)** - a single fast tool that manages the project's Python version (`.python-version`), virtual environment (`.venv`), and dependencies (`pyproject.toml` + `uv.lock`)
- **Reproducible builds** - the `uv.lock` lockfile guarantees that the Actor's Docker image is built with exactly the dependency versions you developed against
- **[Apify SDK](https://docs.apify.com/sdk/python/)** for Python - a toolkit for building Apify [Actors](https://apify.com/actors) and scrapers in Python
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[HTTPX](https://www.python-httpx.org)** - library for making asynchronous HTTP requests in Python
- **[Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)** - library for pulling data out of HTML and XML files

## How it works

1. `Actor.get_input()` gets the input where the page URL is defined
2. `httpx.AsyncClient().get(url)` fetches the page
3. `BeautifulSoup(response.content, 'lxml')` loads the page data and enables parsing the headings
4. This parses the headings from the page and here you can edit the code to parse whatever you need from the page
    ```python
    for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
    ```
5. `Actor.push_data(headings)` stores the headings in the dataset

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

The Actor's `Dockerfile` installs the dependencies with `uv sync --locked --no-dev`, so the image is built with exactly the versions recorded in `uv.lock`, skipping the development-only dependencies. Commit `uv.lock` and `.python-version` whenever they change.

## Resources

- [Apify SDK for Python: uv guide](https://docs.apify.com/sdk/python/docs/guides/uv)
- [uv: Official documentation](https://docs.astral.sh/uv/)
- [BeautifulSoup Scraper](https://apify.com/apify/beautifulsoup-scraper)
- [Python tutorials in Academy](https://docs.apify.com/academy/python)
- [Web scraping with Beautiful Soup and Requests](https://blog.apify.com/web-scraping-with-beautiful-soup/)
- [Integration with Make, GitHub, Zapier, Google Drive, and other apps](https://apify.com/integrations)
- [Video guide on getting scraped data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)
- A short guide on how to build web scrapers using code templates:

[web scraper template](https://www.youtube.com/watch?v=u-i-Korzf8w)
