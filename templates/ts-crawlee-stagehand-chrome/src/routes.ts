import { createStagehandRouter, Dataset } from '@crawlee/stagehand';
import { z } from 'zod';

export const router = createStagehandRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info('enqueueing new URLs');
    await enqueueLinks({
        globs: ['https://apify.com/*'],
        label: 'detail',
    });
});

router.addHandler('detail', async ({ request, page, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });

    // Use Stagehand act() to interact with the page
    await page.act('Close any cookie consent dialogs or popups if present');

    // Use Stagehand extract() to pull structured data with a Zod schema
    const extracted = await page.extract({
        instruction: 'Extract the main heading and a brief description of this page',
        schema: z.object({
            heading: z.string().describe('The main heading of the page'),
            description: z.string().describe('A brief description or subtitle of the page'),
        }),
    });

    await Dataset.pushData({
        url: request.loadedUrl,
        title,
        ...extracted,
    });
});
