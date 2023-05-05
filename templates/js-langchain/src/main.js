import { Actor } from 'apify';
import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { ApifyWrapper } from 'langchain/tools';
import { Document } from 'langchain/document';
import { retrieveVectorIndex, cacheVectorIndex } from './vector_index_cache.js';

await Actor.init();

// There are 2 environment variables you need to configure (https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console):
// 1. Apify API token you obtain at https://console.apify.com/account/integrations. This is not nessesary when running this Actor at Apify platform.
// 2. OpenAI API key you obtain at https://platform.openai.com/account/api-keys.
const { OPENAI_API_KEY, APIFY_API_TOKEN } = process.env;

// Local directory where the vector index will be stored.
const VECTOR_INDEX_PATH = './vector_index';

// Enforce a re-scrape of website content and re-creation of the vector index.
const FORCE_RESCRAPE = false;

if (!OPENAI_API_KEY || !OPENAI_API_KEY.length) throw new Error('Please configure the OPENAI_API_KEY environment variable!');
if (!APIFY_API_TOKEN || !APIFY_API_TOKEN.length) throw new Error('Please configure the APIFY_API_TOKEN environment variable!');

const model = new OpenAI({ openAIApiKey: OPENAI_API_KEY });
const apify = new ApifyWrapper(APIFY_API_TOKEN);

// Now we want to creare a vector index from the crawled documents. 
// Following object represents an input for the https://apify.com/apify/website-content-crawler actor that scrapes the website.
const websiteContentCrawlerInput = {
    startUrls: [{ url: 'https://js.langchain.com/docs' }],
    maxCrawlPages: 1,
};

// First, we check if the vector index is already cached. If not, we run the website content crawler to get the documents.
// By setting up FORCE_RESCRAPE=true you can enforce a re-scrape of the website content and re-creation of the vector index.
console.log('Fetching cached vector index from key-value store...');
const reinitializeIndex = FORCE_RESCRAPE || !(await retrieveVectorIndex(websiteContentCrawlerInput));
if (reinitializeIndex) {
    // Run the Actor, wait for it to finish, and fetch its results from the Apify dataset into a LangChain document loader.
    console.log('Vector index not found.')
    console.log('Running apify/website-content-crawler...');
    const loader = await apify.callActor(
        'apify/website-content-crawler',
        websiteContentCrawlerInput,
        (item) => new Document({
            pageContent: (item.text || ''),
            metadata: { source: item.url },
        })
    );
    const docs = await loader.load();

    // Initialize the vector index from the crawled documents.
    console.log('Feeding vector index with crawling results...');
    const vectorStore = await HNSWLib.fromDocuments(
        docs,
        new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
    );

    // Save the vector index to the key-value store so that we can skip this phase in the next run.
    console.log('Saving vector index to the disk...')
    await vectorStore.save(VECTOR_INDEX_PATH);
    await cacheVectorIndex(websiteContentCrawlerInput, VECTOR_INDEX_PATH);
}

console.log('Initializing vector store...');
const vectorStore = await HNSWLib.load(
    VECTOR_INDEX_PATH,
    new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
);

// Next, create the retrieval chain and enter a query:
console.log('Asking a question...');
const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    returnSourceDocuments: true,
});
const res = await chain.call({ query: 'What is LangChain?' });

console.log(`\n${res.text}\n`);

await Actor.exit();
