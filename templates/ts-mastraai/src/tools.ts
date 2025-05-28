// eslint-disable-next-line import/extensions
import type { Tool } from '@mastra/core/tools';
// eslint-disable-next-line import/extensions
import { createTool } from '@mastra/core/tools';
import { ApifyClient, log } from 'apify';
import { z } from 'zod';

import { InstagramPosts, InstagramPostSchema } from './models.js';

const instagramScraperInputSchema = z.object({
    handle: z.string().describe("Instagram handle of the profile to scrape (without the '@' symbol)."),
    maxPosts: z.number().default(30).describe('Maximum number of posts to scrape.'),
});

const instagramScraperOutputSchema = z.object({
    posts: z.array(InstagramPostSchema).describe('List of scraped Instagram posts'),
});

// Define the Instagram Scraper Tool
export const instagramScraperTool: Tool<
    'instagram-profile-posts-scraper',
    typeof instagramScraperInputSchema,
    typeof instagramScraperOutputSchema
> = createTool({
    id: 'instagram-profile-posts-scraper',
    description: "Tool to scrape Instagram profile posts using Apify's Instagram Scraper.",
    inputSchema: instagramScraperInputSchema,
    outputSchema: instagramScraperOutputSchema,
    execute: async ({ context }) => {
        const token = process.env.APIFY_TOKEN;
        if (!token) {
            throw new Error('APIFY_TOKEN environment variable is missing!');
        }

        const { handle, maxPosts } = context;
        const runInput = {
            directUrls: [`https://www.instagram.com/${handle}/`],
            resultsLimit: maxPosts,
            resultsType: 'posts',
            searchLimit: 1,
        };

        const apifyClient = new ApifyClient({ token });

        // Call the Apify Instagram Scraper actor
        const run = await apifyClient.actor('apify/instagram-scraper').call(runInput);
        if (!run) {
            throw new Error('Failed to start the Actor apify/instagram-scraper');
        }

        // Fetch dataset items
        const datasetId = run.defaultDatasetId;
        const dataset = await apifyClient.dataset(datasetId).listItems();
        const datasetItems: unknown[] = dataset.items;

        // Validate and convert dataset items to InstagramPosts
        try {
            const posts: InstagramPosts = InstagramPosts.fromRaw(datasetItems);
            return { posts: posts.root };
        } catch (error) {
            log.warning(`Received invalid dataset items: ${JSON.stringify(datasetItems)}. Error: ${error}`);
            throw new Error('Received invalid dataset items.');
        }
    },
});
