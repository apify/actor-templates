import { Actor } from 'apify';
import { ApifyDatasetLoader } from 'langchain/document_loaders/web/apify_dataset';
import { Document } from 'langchain/document';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { rmdir } from 'node:fs/promises';

import { retrieveVectorIndex, cacheVectorIndex } from './vector_index_cache.js';

await Actor.init();

// There are 2 steps you need to proceed first in order to be able to run this template:
// 1. If you are running template locally then you need to authenticate to Apify platform by calling `apify login` in your terminal. Without this, you won't be able to run the required Website Content Crawler Actor to gather the data.
// 2. Configure the OPENAI_API_KEY environment variable (https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console) with your OpenAI API key you obtain at https://platform.openai.com/account/api-keys.
const { OPENAI_API_KEY, APIFY_TOKEN } = process.env;

// You can configure the input for the Actor in the Apify UI when running on the Apify platform or editing storage/key_value_stores/default/INPUT.json when running locally.
const {
    startUrls = [{ url: 'https://wikipedia.com' }],
    maxCrawlPages = 3,
    forceRecrawl = false, // Enforce a re-crawl of website content and re-creation of the vector index.
    query = 'What is Wikipedia?',
    openAIApiKey = OPENAI_API_KEY, // This is a fallback to the OPENAI_API_KEY environment variable when value is not present in the input.
} = await Actor.getInput() || {};

// Local directory where the vector index will be stored.
const VECTOR_INDEX_PATH = './vector_index';

if (!openAIApiKey || !openAIApiKey.length) throw new Error('Please configure the OPENAI_API_KEY as environment variable or enter it into the input!');
if (!APIFY_TOKEN || !APIFY_TOKEN.length) throw new Error('Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.');

// Now we want to creare a vector index from the crawled documents.
// Following object represents an input for the https://apify.com/apify/website-content-crawler actor that crawls the website to gather the data.
const websiteContentCrawlerInput = { startUrls, maxCrawlPages };

// This variable will contain a vector index that we will use to retrieve the most relevant documents for a given query.
let vectorStore;

// First, we check if the vector index is already cached. If not, we run the website content crawler to get the documents.
// By setting up forceRecrawl=true you can enforce a re-scrape of the website content and re-creation of the vector index.
console.log('Fetching cached vector index from key-value store...');
const reinitializeIndex = forceRecrawl || !(await retrieveVectorIndex(websiteContentCrawlerInput));
if (reinitializeIndex) {
    // Run the Actor, wait for it to finish, and fetch its results from the Apify dataset into a LangChain document loader.
    console.log('Vector index was not found.')
    console.log('Running apify/website-content-crawler to gather the data...');
    const loader = await ApifyDatasetLoader.fromActorCall(
        'apify/website-content-crawler',
        websiteContentCrawlerInput,
        {
            datasetMappingFunction: (item) => new Document({
                pageContent: (item.text || ''),
                metadata: { source: item.url },
            }),
            clientOptions: { token: APIFY_TOKEN },
        }
    );

    const docs = await loader.load();

    // Initialize the vector index from the crawled documents.
    console.log('Feeding vector index with crawling results...');
    vectorStore = await HNSWLib.fromDocuments(
        docs,
        new OpenAIEmbeddings({ openAIApiKey })
    );

    // Save the vector index to the key-value store so that we can skip this phase in the next run.
    console.log('Saving vector index to the disk...')
    await vectorStore.save(VECTOR_INDEX_PATH);
    await cacheVectorIndex(websiteContentCrawlerInput, VECTOR_INDEX_PATH);
}

// Load the vector index from the disk if not already initialized above.
if (!vectorStore) {
    console.log('Initializing the vector store...');
    vectorStore = await HNSWLib.load(
        VECTOR_INDEX_PATH,
        new OpenAIEmbeddings({ openAIApiKey })
    );
}

// Next, create the retrieval chain and enter a query:
console.log('Asking model a question...');
const model = new OpenAI({ openAIApiKey });
const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    returnSourceDocuments: true,
});
const res = await chain.call({ query });

console.log(`\n${res.text}\n`);

// Remove the vector index directory as we have it cached in the key-value store for the next time.
await rmdir(VECTOR_INDEX_PATH, { recursive: true });

await Actor.setValue('OUTPUT', res);
await Actor.exit();
