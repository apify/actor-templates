import { PlaywrightCrawlingContext } from '@crawlee/playwright';

export async function handleStart({ enqueueLinks, log }: PlaywrightCrawlingContext) {
    log.info(`Handle Start URLs`);
    await enqueueLinks({
        globs: ['https://apify.com/*'],
        transformRequestFunction(opts) {
            opts.userData ??= {};
            opts.userData.label = 'DETAIL';
            return opts;
        },
    });
}

export async function handleList({ log }: PlaywrightCrawlingContext) {
    log.info(`Handle pagination`);
}

export async function handleDetail({ request, page, log }: PlaywrightCrawlingContext) {
    const title = await page.title();
    log.info(`Handle details: ${title} [${request.loadedUrl}]`);
}
