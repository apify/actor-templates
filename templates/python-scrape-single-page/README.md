# Scrape single-page in Python Actor template

A template for scraping data from a single web page in Python. The URL of the web page is passed in via input, which is defined by the [input schema](https://docs.apify.com/platform/actors/development/input-schema). The template uses the [Requests](https://requests.readthedocs.io/) to get the HTML of the page and the [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) to parse the data from it. The data are then stored in a [dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset) where you can easily access them.

The scraped data in this template are page headings but you can easily edit the code to scrape whatever you want from the page.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/js/)** - a toolkit for building actors
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your actor's input
- **[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)** - store structured data where each object stored has the same attributes

## How it works

1. `Actor.get_input()` gets the input where the page URL is defined
2. `requests.get(url)` fetches the page
3. `BeautifulSoup(response.content, 'html.parser')` loads the page data and enables parsing the headings
4. This parses the headings from the page and here you can edit the code to parse whatever you need from the page

    ```python
    for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
    ```

5. `Actor.push_data(headings)` stores the headings in the dataset