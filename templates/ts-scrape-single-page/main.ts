// Axios import - Promise based HTTP client for the browser and node.js (Read more at https://axios-http.com/docs/intro)
import axios from "axios";

// Cheerio - The fast, flexible & elegant library for parsing and manipulating HTML and XML (Read more at https://cheerio.js.org/)
import * as cheerio from 'cheerio';

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from "apify";

// Initialize the Apify SDK
await Actor.init();

interface Input {
    url: string;
}

// Structure of input is defined in input_schema.json.
const input = await Actor.getInput<Input>();

if(!input) throw new Error('Input is missing!');

// Getting the URL from input defined in ./storage/key_value_stores/default/INPUT.json
const { url } = input;

interface Heading {
    level: string,
    text: string
}
const headings : Heading[] = [];

try {
    // Fetching the HTML content of the page
    const response = await axios.get(url);

    // Load the HTML to cheerio
    const $ = cheerio.load(response.data);

    // Extracting all the headings from the page (tag name and text)
    $('h1, h2, h3, h4, h5, h6').each((i, element) => {
        const headingObject = {
            level: $(element).prop("tagName").toLowerCase(),
            text: $(element).text(),
        };
        console.log('Extracted heading', headingObject);
        headings.push(headingObject);
    });
} catch (error) {
    console.error(error);
}

// Pushing the data to dataset
await Actor.pushData(headings);

// Exit successfully
await Actor.exit();
