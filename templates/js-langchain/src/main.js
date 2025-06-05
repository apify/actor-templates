/* eslint-disable import/extensions */
import { rm } from 'node:fs/promises';

import { ApifyDatasetLoader } from '@langchain/community/document_loaders/web/apify_dataset';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Actor, log } from 'apify';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { Document } from 'langchain/document';

// This is ESM project, and as such, it requires you to specify extensions in your relative imports.
// Read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
import { cacheVectorIndex, retrieveVectorIndex } from './vector_index_cache.js';

await Actor.init();

// Follow these steps to run this template:
// 1. If running locally, authenticate to the Apify platform by executing `apify login` in your terminal.
//    This is necessary to run the Website Content Crawler Actor for data gathering.
// 2. Set the `OPENAI_API_KEY` environment variable with your OpenAI API key, which can be obtained from
//    https://platform.openai.com/account/api-keys. Refer to
//    https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console for guidance
//    on setting environment variables.
const { OPENAI_API_KEY, APIFY_TOKEN } = process.env;

// You can configure the input for the Actor in the Apify UI when running on the Apify platform or editing
// storage/key_value_stores/default/INPUT.json when running locally.
const {
    startUrls = [{ url: 'https://wikipedia.com' }],
    maxCrawlPages = 3,
    forceRecrawl = false, // Enforce a re-crawl of website content and re-creation of the vector index.
    query = 'What is Wikipedia?',
    openAIApiKey = OPENAI_API_KEY, // This is a fallback to the OPENAI_API_KEY environment variable when value is not present in the input.
} = (await Actor.getInput()) || {};

// Local directory where the vector index will be stored.
const VECTOR_INDEX_PATH = './vector_index';

const prompt = ChatPromptTemplate.fromTemplate(
    `Answer the user's question: {input} based on the following context {context}`,
);

if (!openAIApiKey)
    throw new Error('Please configure the OPENAI_API_KEY as environment variable or enter it into the input!');
if (!APIFY_TOKEN)
    throw new Error(
        'Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.',
    );

// Now we want to create a vector index from the crawled documents.
// Following object represents an input for the https://apify.com/apify/website-content-crawler Actor that crawls the website to gather the data.
const websiteContentCrawlerInput = { startUrls, maxCrawlPages };

// This variable will contain a vector index that we will use to retrieve the most relevant documents for a given query.
let vectorStore;

// First, we check if the vector index is already cached. If not, we run the website content crawler to get the documents.
// By setting up forceRecrawl=true you can enforce a re-scrape of the website content and re-creation of the vector index.
log.info('Fetching cached vector index from key-value store...');
const reinitializeIndex = forceRecrawl || !(await retrieveVectorIndex(websiteContentCrawlerInput));
if (reinitializeIndex) {
    // Run the Actor, wait for it to finish, and fetch its results from the Apify dataset into a LangChain document loader.
    log.info('Vector index was not found.');
    log.info('Running apify/website-content-crawler to gather the data...');
    const loader = await ApifyDatasetLoader.fromActorCall('apify/website-content-crawler', websiteContentCrawlerInput, {
        datasetMappingFunction: (item) =>
            new Document({
                pageContent: item.text || '',
                metadata: { source: item.url },
            }),
        clientOptions: { token: APIFY_TOKEN },
    });

    // Initialize the vector index from the crawled documents.
    log.info('Feeding vector index with crawling results...');
    const docs = await loader.load();
    vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey }));

    // Save the vector index to the key-value store so that we can skip this phase in the next run.
    log.info('Saving vector index to the disk...');
    await vectorStore.save(VECTOR_INDEX_PATH);
    await cacheVectorIndex(websiteContentCrawlerInput, VECTOR_INDEX_PATH);
}

// Load the vector index from the disk if not already initialized above.
if (!vectorStore) {
    log.info('Initializing the vector store...');
    vectorStore = await HNSWLib.load(VECTOR_INDEX_PATH, new OpenAIEmbeddings({ openAIApiKey }));
}

// Next, create the retrieval chain and enter a query:
const llm = new OpenAI({ openAIApiKey });
const combineDocsChain = await createStuffDocumentsChain({
    llm,
    prompt,
});

const chain = await createRetrievalChain({
    combineDocsChain,
    retriever: vectorStore.asRetriever(),
    returnSourceDocuments: true,
});

log.info('Asking model a question...');
const res = await chain.invoke({ input: query });

log.info(`Question: ${query}`);
log.info(`Model response: ${res.answer}`);

// Remove the vector index directory as we have it cached in the key-value store for the next time.
await rm(VECTOR_INDEX_PATH, { recursive: true });

await Actor.setValue('OUTPUT', res);
await Actor.exit();
