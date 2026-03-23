import { createCheerioRouter, Dataset } from '@crawlee/cheerio';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ request, $, log }) => {
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    await Dataset.pushData({ url: request.loadedUrl, title });
});

router.addHandler('detail', async ({ request, $, log }) => {
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    await Dataset.pushData({ url: request.loadedUrl, title });
});
