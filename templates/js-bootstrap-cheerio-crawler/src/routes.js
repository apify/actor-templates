import { createCheerioRouter } from 'crawlee';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ request, log }) => {
    log.info(`Processing ${request.url}`);
    // Add code
});

router.addHandler('detail', async ({ request, log }) => {
    log.info(`Processing ${request.url}`);
    // Add code
});
