# LangChain.js example

> LangChain is a framework for developing applications powered by language models.

This example template illustrates how to use LangChain.js within the Apify Actors. This example:
- Crawls given website
- Vectorizes the data using OpenAI API
- Caches the vector index in the key-value store so that when you run Actor for the same website again, the cached data are used.
- Data are fed to the OpenAI model, and a given query is asked.

This serves purely as an example of the whole pipeline. For production use, we recommend you separate crawling, data vectorization, and prompting to separate Actors.

You can also easily replace local vector stores with [Pinecone](https://www.pinecone.io/) or similar databases. See the [LangChain.js](https://js.langchain.com/docs/) documentation for more information.
