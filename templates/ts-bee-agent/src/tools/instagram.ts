import { Actor, log } from 'apify';
import { Emitter } from 'bee-agent-framework/emitter/emitter';
import { AnyToolSchemaLike } from 'bee-agent-framework/internals/helpers/schema';
import { JSONToolOutput, Tool, ToolEmitter, ToolInput } from 'bee-agent-framework/tools/base';
import { z } from 'zod';

export interface InstagramPost {
    url: string;
    likes: number;
    comments: number;
    timestamp: string;
    caption?: string;
    alt?: string;
}

interface InstagramScrapeToolOutput {
    posts: InstagramPost[];
}

/**
 * @class InstagramScrapeTool
 * @extends Tool
 *
 * @description
 * This class represents a tool for scraping Instagram profile posts.
 * It extends the base Tool class and provides a specific implementation for
 * scraping posts from a given Instagram profile.
 */
export class InstagramScrapeTool extends Tool<JSONToolOutput<InstagramScrapeToolOutput>> {
    override name: string = 'instagram-scrape-profile-posts';

    override description: string = 'Tool to scrape Instagram profile posts.';

    override inputSchema(): Promise<AnyToolSchemaLike> | AnyToolSchemaLike {
        return z.object({
            handle: z.string().describe('Instagram handle of the profile to scrape (without the "@" symbol).'),
            maxPosts: z.number().default(30).describe('Maximum number of posts to scrape.'),
        }).required({ handle: true });
    }

    public readonly emitter: ToolEmitter<ToolInput<this>, JSONToolOutput<InstagramScrapeToolOutput>> = Emitter.root.child({
        namespace: ['tool', 'instagram_scrape'],
        creator: this,
    });

    protected async _run(input: ToolInput<this>): Promise<JSONToolOutput<InstagramScrapeToolOutput>> {
        const { handle, maxPosts = 30 } = input;

        const runInput = {
            directUrls: [`https://www.instagram.com/${handle}/`],
            resultsLimit: maxPosts,
            resultsType: 'posts',
            searchLimit: 1,
        };

        const run = await Actor.apifyClient.actor('apify/instagram-scraper').call(runInput);
        if (!run) {
            throw new Error('Failed to start the Actor apify/instagram-scraper');
        }

        const datasetId = run.defaultDatasetId;
        const datasetItems = await Actor.apifyClient.dataset(datasetId).listItems();
        const posts: InstagramPost[] = [];

        for (const item of datasetItems.items) {
            const post: InstagramPost = {
                url: item.url as string,
                caption: item.caption as string,
                alt: item.alt as string,
                likes: item.likesCount as number,
                comments: item.commentsCount as number,
                timestamp: item.timestamp as string,
            };

            // Only include posts with all required fields
            if (!post.url || post.likes === undefined || post.comments === undefined || !post.timestamp) {
                log.warning('Skipping post with missing fields:', item);
                continue;
            }

            posts.push(post);
        }

        return new JSONToolOutput({ posts });
    }

    static {
        // Makes the class serializable
        this.register();
    }
}
