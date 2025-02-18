import { DynamicStructuredTool } from '@langchain/core/tools';
import { log } from 'apify';
import { z } from 'zod';

const MAX_RESULTS_DEFAULT = 1;
const ACTOR_BASE_URL = 'https://rag-web-browser.apify.actor/search';

/**
 * Search phrase or a URL at Google and return crawled web pages as text or Markdown using ApiFy RAG Web Browser.
 * @type {DynamicStructuredTool<{readonly query?: *, readonly maxResults?: *}>}
 */
export const webSearchTool = new DynamicStructuredTool({
    name: 'search',
    description: 'Search phrase or a URL at Google and return crawled web pages as text or Markdown',
    schema: z.object({
        query: z.string().describe('Google Search keywords or a URL of a specific web page'),
        maxResults: z.number().int().positive().default(MAX_RESULTS_DEFAULT)
            .describe('The maximum number of top organic Google Search results whose web pages will be extracted'),
    }),
    func: async ({ query, maxResults }) => {
        if (!process.env.APIFY_TOKEN) {
            throw new Error('APIFY_TOKEN is required but not set in your environment variables');
        }

        const queryParams = new URLSearchParams({
            query,
            maxResults: maxResults.toString(),
        });
        const url = `${ACTOR_BASE_URL}?${queryParams.toString()}`;
        log.info(`Calling RAG Web Browser with URL: ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to call RAG Web Browser: ${response.statusText}`);
        }
        const responseBody = await response.json();
        return responseBody.map((item) => `### ${item?.metadata?.title}\n${item?.text || item?.markdown}`).join('\n\n');
    },
});
