// Axios import - Promise based HTTP client for the browser and node.js (Read more at https://axios-http.com/docs/intro)
import axios from "axios";

// Cheerio - The fast, flexible & elegant library for parsing and manipulating HTML and XML (Read more at https://cheerio.js.org/)
import * as cheerio from 'cheerio';

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from "apify";

// Initialize the Apify SDK
await Actor.init();

// Structure of input is defined in input_schema.json.
const input = await Actor.getInput();

// Getting the URL from input defined in ./storage/key_value_stores/default/INPUT.json
const { url } = input;

const headings = [];
try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    $('h1, h2, h3, h4, h5, h6').each((i, element) => {
        headings.push({
            level: $(element).prop("tagName").toLowerCase(),
            text: $(element).text(),
        });
    });
} catch (error) {
    console.error(error);
}

// Pushing the data to dataset
await Actor.pushData(headings);

// Exit successfully
await Actor.exit();
