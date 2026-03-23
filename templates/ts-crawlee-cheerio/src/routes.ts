import { createCheerioRouter, Dataset } from '@crawlee/cheerio';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, request, $, log }) => {
    log.info('enqueueing new URLs');
    await enqueueLinks();

    // Extract title from the page.
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    // Save url and title to Dataset - a table-like storage.
    await Dataset.pushData({ url: request.loadedUrl, title });
});
