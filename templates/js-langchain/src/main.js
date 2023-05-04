import { Actor } from 'apify';
import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { ApifyWrapper } from 'langchain/tools';
import { Document } from 'langchain/document';
import { retrieveVectorIndex, cacheVectorIndex } from './vector_index_cache.js';

await Actor.init();

// There are 2 environment variables you need to configure.
// 1. Apify API token you obtain at https://console.apify.com/account/integrations. This is not nessesary when running this Actor at Apify platform.
// 2. OpenAI API key you obtain at https://platform.openai.com/account/api-keys.
const { OPENAI_API_KEY, APIFY_API_TOKEN } = process.env;

const VECTOR_INDEX_PATH = './vector_index';

if (!OPENAI_API_KEY || !OPENAI_API_KEY.length) throw new Error('Please configure the OPENAI_API_KEY environment variable!');
if (!APIFY_API_TOKEN || !APIFY_API_TOKEN.length) throw new Error('Please configure the APIFY_API_TOKEN environment variable!');

const model = new OpenAI({ openAIApiKey: OPENAI_API_KEY });
const apify = new ApifyWrapper(APIFY_API_TOKEN);

// Then run the Actor, wait for it to finish, and fetch its results from the Apify dataset into a LangChain document loader.
// Note that if you already have some results in an Apify dataset, you can load them directly using `ApifyDatasetLoader`, 
// as shown in [this guide](../../../indexes/document_loaders/examples/web_loaders/apify_dataset.md). 
// In that guide, you'll also find the explanation of the `datasetMappingFunction`, 
// which is used to map fields from the Apify dataset records to LangChain `Document` fields.
const websiteContentCrawlerInput = {
    startUrls: [{ url: 'https://js.langchain.com/docs' }],
    maxCrawlPages: 30,
};

console.log('Fetching cached vector index from key-value store...');
const wasFetched = await retrieveVectorIndex(websiteContentCrawlerInput);
if (!wasFetched) {
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

    // Initialize the vector index from the crawled documents:
    console.log('Feeding vector index with crawling results...');
    const vectorStore = await HNSWLib.fromDocuments(
        docs,
        new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
    );

    // Save the vector index to the key-value store.
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
