import { CheerioCrawlingContext } from '@crawlee/cheerio';

export async function handleStart({ enqueueLinks, log }: CheerioCrawlingContext) {
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

export async function handleList({ log }: CheerioCrawlingContext) {
    log.info(`Handle pagination`);
}

export async function handleDetail({ request, $, log }: CheerioCrawlingContext) {
    const title = $('title').text();
    log.info(`Handle details: ${title} [${request.loadedUrl}]`);
}
