import { Dataset, createCheerioRouter } from 'crawlee';

// Create a router that will handle the requests.
export const router = createCheerioRouter();

// Add a default handler that will enqueue new URLs - it will be called for all URLs that are not handled by other handlers.
router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    await enqueueLinks({
        globs: ['https://apify.com/*'],
        label: 'detail',
    });
});

// Add a handler that will handle the detail pages - extract the title and push it to the dataset.
router.addHandler('detail', async ({ request, $, log }) => {
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    // Save the URL of the page and heading to Dataset - a table-like storage.
    await Dataset.pushData({
        url: request.loadedUrl,
        title,
    });
});
