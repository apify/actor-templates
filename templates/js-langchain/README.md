## LangChain.js template

> LangChain is a framework for developing applications powered by language models.

This example template illustrates how to use LangChain.js with Apify to crawl the web data, vectorize them, and prompt the OpenAI model. All of this is within a single Apify Actor and slightly over a hundred lines of code.

## Included features

- **[Apify SDK](https://docs.apify.com/sdk/js/)** - a toolkit for building [Actors](https://apify.com/actors)
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Langchain.js](https://github.com/hwchase17/langchainjs)** - a framework for developing applications powered by language models
- **[OpenAI](https://openai.com/)** - a powerful language model

## How it works

The code contains the following steps:

1. Crawls given website using [Website Content Crawler](https://apify.com/apify/website-content-crawler) Actor.
2. Vectorizes the data using the [OpenAI](https://openai.com/) API.
3. Caches the vector index in the [key-value store](https://docs.apify.com/platform/storage/key-value-store) so that when you run Actor for the same website again, the cached data are used to speed it up.
4. Data are fed to the OpenAI model using [Langchain.js](https://github.com/hwchase17/langchainjs), and a given query is asked.

## Before you start

To be able to run this template both locally and on the Apify platform, you need to:

- Have an [Apify account](https://console.apify.com/) and sign into it using `apify login` command in your terminal. Without this, you won't be able to run the required [Website Content Crawler](https://apify.com/apify/website-content-crawler) Actor to gather the data.
- Have an [OpenAI](https://openai.com/) account and an API key. This is needed for vectorizing the data and also to be able to prompt the OpenAI model.
    - When running locally store this as OPENAI_API_KEY environment variable (https://docs.apify.com/cli/docs/vars#set-up-environment-variables-in-apify-console).
    - When running on Apify platform, you can simply paste this into the input field in the input UI.

## Production use

> This serves purely as an example of the whole pipeline.

For production use, we recommend you to:

- Separate crawling, data vectorization, and prompting into separate Actors. This way, you can run them independently and scale them separately.
- Replace the local vector store with [Pinecone](https://www.pinecone.io/) or a similar database. See the [LangChain.js docs](https://js.langchain.com/docs/) for more information.

## Resources

- [Pinecone integration](https://apify.com/jan.turon/pinecone-integration) Actor
- [How to use Pinecone with LLMs](https://blog.apify.com/what-is-pinecone-why-use-it-with-llms/)
- [How to use LangChain with OpenAI, Pinecone, and Apify](https://blog.apify.com/how-to-use-langchain/)
- [Integration with Zapier](https://apify.com/integrations), Make, Google Drive and others
- [Video guide on getting data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)
- A short guide on [how to create web scrapers using code templates](https://www.youtube.com/watch?v=u-i-Korzf8w)

[Web Scraping Data for Generative AI](https://www.youtube.com/watch?v=8uvHH-ocSes)
