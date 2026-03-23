import { createCheerioRouter } from '@crawlee/cheerio';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ request, $, log, pushData }) => {
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    await pushData({ url: request.loadedUrl, title });
});

router.addHandler('detail', async ({ request, $, log, pushData }) => {
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    await pushData({ url: request.loadedUrl, title });
});
