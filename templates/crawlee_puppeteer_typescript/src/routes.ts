import { PuppeteerCrawlingContext } from '@crawlee/puppeteer';

export async function handleStart({ enqueueLinks, log }: PuppeteerCrawlingContext) {
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

export async function handleList({ log }: PuppeteerCrawlingContext) {
    log.info(`Handle pagination`);
}

export async function handleDetail({ request, page, log }: PuppeteerCrawlingContext) {
    const title = await page.title();
    log.info(`Handle details: ${title} [${request.loadedUrl}]`);
}
