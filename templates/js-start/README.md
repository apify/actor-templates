# Start with Scrape single page template

Start web scraping easily by extracting data from a single web page. Simply provide the page URL and the template logic will extract any data from it.
## Getting started

Create a scraper for getting data from a single web page in JavaScript (Node.js) with [Apify SDK](https://docs.apify.com/sdk/js/) by using the [Axios client](https://axios-http.com/docs/intro) to get the HTML of the page and the [Cheerio library](https://cheerio.js.org/) to parse the data from it.

## Template logic
- Use the [Apify SDK](https://docs.apify.com/sdk/js/) to set up the crawler as an [Actor](https://docs.apify.com/academy/getting-started/actors) by wrapping the logic with `Actor.init()` and `Actor.exit()`
- Load the provided page URL as input for the Actor with [`Actor.getInput()`](https://docs.apify.com/sdk/js/reference/class/Actor#getInput)
- Fetch the page HTML by performing a HTTP GET request to the provided URL with [axios.get()](https://axios-http.com/docs/api_intro) 
- Parse the downloaded HTML to enable data extraction with [cheerio.load()](https://cheerio.js.org/docs/api#load) 
- Data extractions - extract all the headings (or any other data you need) from the parsed HTML of the page
- Save the extracted data to the [Dataset](https://docs.apify.com/sdk/js/reference/class/Dataset) storage with [Actor.pushData()](https://docs.apify.com/sdk/js/reference/class/Actor#pushData)



<br/>
<br/>
<br/>
<br/>

## ... continue with generic instructions


