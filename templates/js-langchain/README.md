# LangChain.js example

> LangChain is a framework for developing applications powered by language models.

This example template illustrates how to use LangChain.js to crawl the web data, vectorize them, and prompt the OpenAI model. All of this within a single Apify Actor.

The code contains following steps:
- Crawls given website using [Website Content Crawler](https://apify.com/mtrunkat/website-content-crawler) Actor.
- Vectorizes the data using the [OpenAI](https://openai.com/) API.
- Caches the vector index in the [key-value store](https://docs.apify.com/platform/storage/key-value-store) so that when you run Actor for the same website again, the cached data are used.
- Data are fed to the OpenAI model using the [Langchain.js](https://github.com/hwchase17/langchainjs), and a given query is asked.

## Prerequisites

To be able to run this template both locally and at the Apify Platform, you need to:
- Have an [Apify account](https://console.apify.com/) and sign into it using `apify login` command. This is needed for running the [Website Content Crawler](https://apify.com/mtrunkat/website-content-crawler) Actor to gather the data.
- Have an [OpenAI](https://openai.com/) account and an API key. This is needed for vectorizing the data and also to be able to prompt the OpenAI model.
    - When running locally store this as OPENAI_API_KEY environment variable (https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console).
    - When running on Apify platform, you can simply paste this into the input field in the UI.

## Production use

> This serves purely as an example of the whole pipeline.

For production use, we recommend you to:
- Separate crawling, data vectorization, and prompting into separate Actors. This way, you can run them independently and scale them separately.
- Replace local vector store with [Pinecone](https://www.pinecone.io/) or similar database. See the [LangChain.js](https://js.langchain.com/docs/) documentation for more information.
