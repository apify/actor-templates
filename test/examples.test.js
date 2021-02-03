/* eslint-disable global-require */

const Apify = require('apify');
const utils = require('apify/build/utils');
const { ENV_VARS } = require('apify-shared/consts');
const { LocalStorageDirEmulator } = require('./local_storage_dir_emulator');

// eslint-disable-next-line no-useless-escape
const urlRegex = '^https?:\/\/w{0,3}\.?.+';
const exampleData = [
    {
        url: 'https://apify.com/',
        headingCount: 11,
    },
    {
        url: 'https://apify.com/storage',
        headingCount: 8,
    },
    {
        url: 'https://apify.com/proxy',
        headingCount: 4,
    },
];
let prevEnvHeadless;

jest.retryTimes(3);

describe('Examples - testing runnable codes behaviour ', () => {
    let localStorageEmulator;
    let exampleFunc;
    let callData;
    let dataSetData = [];
    let kvStoreData = [];
    let logs = [];

    beforeAll(async () => {
        prevEnvHeadless = process.env[ENV_VARS.HEADLESS];
        process.env[ENV_VARS.HEADLESS] = '1';
        Apify.main = (func) => {
            exampleFunc = func;
        };

        Apify.setValue = (key, storeValue) => {
            kvStoreData.push({
                key,
                storeValue,
            });
        };
        Apify.pushData = (data) => {
            if (Array.isArray(data)) {
                dataSetData = data;
            } else {
                dataSetData.push(data);
            }
        };
        Apify.call = (act, input) => {
            callData = { act, input };
        };
        console.log = (log) => {
            logs.push(log);
        };
    });

    beforeAll(() => {
        localStorageEmulator = new LocalStorageDirEmulator();
    });

    beforeEach(async () => {
        const storageDir = await localStorageEmulator.init();
        utils.apifyStorageLocal = utils.newStorageLocal({ storageDir });
        const queue = await Apify.openRequestQueue();
        await queue.drop();
    });

    afterEach(async () => {
        dataSetData = [];
        kvStoreData = [];
        logs = [];
        callData = null;
    });

    afterAll(async () => {
        await localStorageEmulator.destroy();
        process.env[ENV_VARS.HEADLESS] = prevEnvHeadless;
    });

    test('accept user input example works', async () => {
        const kvStore = await Apify.openKeyValueStore();
        const input = { test: 'testing input' };
        await kvStore.setValue('INPUT', input);

        require('../examples/accept_user_input/accept_user_input.js');
        await exampleFunc();

        expect(logs.length).toBe(1);
        const savedInput = logs[0];
        expect(typeof savedInput).toBe('object');
        expect(savedInput).toHaveProperty('test');
        const { test } = savedInput;
        expect(test).toBe('testing input');

        await kvStore.drop();
    });

    test('add data to dataset example works', async () => {
        require('../examples/add_data_to_dataset/add_data_to_dataset.js');
        await exampleFunc();

        expect(dataSetData.length).toBe(3);
        dataSetData.forEach((result) => {
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('html');
            expect(result.url).toBeTruthy();
        });
    });

    test('basic crawler example works', async () => {
        require('../examples/basic_crawler/basic_crawler.js');
        await exampleFunc();

        expect(dataSetData.length).toBe(4);
        dataSetData.forEach((result) => {
            expect(result).toBeInstanceOf(Object);
            expect(result).toHaveProperty('url');
            expect(result.url).toBeTruthy();
            expect(result).toHaveProperty('html');
            expect(result.url).toBeTruthy();
        });
    });

    test('call actor example works', async () => {
        const email = 'jan.barta@apify.com';
        const originalNewClient = Apify.newClient;
        Apify.newClient = () => {
            return {
                user() {
                    return {
                        get() {
                            return { email };
                        },
                    };
                },
            };
        };
        require('../examples/call_actor/call_actor.js');
        await exampleFunc();

        const { input } = callData;
        const { to, html } = input;

        expect(to).toBe(email);
        expect(html).toBeTruthy();
        expect(html).toContain('<div id="random_word">');
        expect(html).toContain('<div id="random_word_definition">');

        Apify.newClient = originalNewClient;
    });

    test('capture screenshot - puppeteer page screenshot example works', async () => {
        require('../examples/capture_screenshot/puppeteer_page_screenshot.js');
        await exampleFunc();

        expect(kvStoreData.length).toBe(1);
        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('my-key');
        expect(storeValue).toBeDefined();
        expect(Buffer.isBuffer(storeValue)).toBe(true);
    });

    test('capture screenshot - puppeteer apify snapshot example works', async () => {
        require('../examples/capture_screenshot/puppeteer_apify_snapshot.js');
        await exampleFunc();

        const store = await Apify.openKeyValueStore();
        await store.forEachKey(async (key) => {
            const storeValue = await store.getValue(key);
            expect(storeValue).toBeDefined();
            expect(Buffer.isBuffer(storeValue)).toBe(true);
        });
        await store.drop();
    });

    test('capture screenshot - puppeteer crawler page screenshot example works', async () => {
        require('../examples/capture_screenshot/puppeteer_crawler_page_screenshot.js');
        await exampleFunc();

        expect(kvStoreData.length).toBe(3);
        kvStoreData.forEach((result) => {
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('key');
            expect(result.key).toBeTruthy();
            expect(result).toHaveProperty('storeValue');
            expect(Buffer.isBuffer(result.storeValue)).toBe(true);
        });
    });

    test('capture screenshot - puppeteer crawler apify snapshot example works', async () => {
        require('../examples/capture_screenshot/puppeteer_crawler_apify_snapshot.js');
        await exampleFunc();

        const store = await Apify.openKeyValueStore();
        let imageCount = 0;
        await store.forEachKey(async (key) => {
            if (/^http.*?www\.example\.com.*?\d/.test(key)) {
                imageCount++;
                const storeValue = await store.getValue(key);
                expect(Buffer.isBuffer(storeValue)).toBe(true);
            }
        });
        expect(imageCount).toBe(3);
        await store.drop();
    });

    test('cheerio crawler example works', async () => {
        require('../examples/cheerio_crawler/cheerio_crawler.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        kvStoreData.forEach((result) => {
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('h1texts');
            expect(result.url).toBeTruthy();
            expect(result.title).toBeTruthy();
            expect(Array.isArray(result.h1texts)).toBe(true);
        });
    });

    test('crawl sitemap - playwright crawler example works', async () => {
        require('../examples/crawl_sitemap/crawl_sitemap_playwright.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl sitemap - cheerio crawler example works', async () => {
        require('../examples/crawl_sitemap/crawl_sitemap_cheerio.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl sitemap - puppeteer crawler example works', async () => {
        require('../examples/crawl_sitemap/crawl_sitemap_puppeteer.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl all links - cheerio crawler example works', async () => {
        require('../examples/crawl_all_links/crawl_all_links_cheerio.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl all links - puppeteer crawler example works', async () => {
        require('../examples/crawl_all_links/crawl_all_links_puppeteer.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl all links - playwright crawler example works', async () => {
        require('../examples/crawl_all_links/crawl_all_links_playwright.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl multiple urls - playwright crawler example works', async () => {
        require('../examples/crawl_multiple_urls/crawl_multiple_urls_playwright.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match('TITLE: Example Domain'));
        expect(crawledUrls.length).toBe(3);
    });

    test('crawl multiple urls - cheerio crawler example works', async () => {
        require('../examples/crawl_multiple_urls/crawl_multiple_urls_cheerio.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match('TITLE: Example Domain'));
        expect(crawledUrls.length).toBe(3);
    });

    test('crawl multiple urls - puppeteer crawler example works', async () => {
        require('../examples/crawl_multiple_urls/crawl_multiple_urls_puppeteer.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match('TITLE: Example Domain'));
        expect(crawledUrls.length).toBe(3);
    });

    test('crawl relative links example works', async () => {
        require('../examples/crawl_relative_links/crawl_relative_links.js');
        await exampleFunc();

        const crawledUrls = logs.filter((log) => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('crawl single url example works', async () => {
        require('../examples/crawl_single_url/crawl_single_url.js');
        await exampleFunc();

        expect(logs.length).toBe(1);
        const body = logs[0];
        expect(body).toBeTruthy();
        expect(body.includes('<html>'));
    });

    test('crawl some links - cheerio example works', async () => {
        require('../examples/crawl_some_links/crawl_some_links_cheerio.js');
        await exampleFunc();

        const successPages = logs.filter((log) => log.includes('https://apify.com/'));
        expect(successPages.length).toBeGreaterThan(0);
    });

    test('forms example works', async () => {
        require('../examples/forms/forms.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((result) => {
            expect(result).toBeInstanceOf(Object);
            expect(result).toHaveProperty('url');
            expect(result.url).toBeTruthy();
            expect(result).toHaveProperty('name');
            expect(result.name).toBeTruthy();
        });
    });

    test('puppeteer recursive crawl example works', async () => {
        require('../examples/puppeteer_recursive_crawl/puppeteer_recursive_crawl.js');
        await exampleFunc();

        const titles = logs.filter((log) => log.includes('Title of'));
        expect(titles.length).toBeGreaterThan(0);
    });

    test('map example works', async () => {
        const dataset = await Apify.openDataset();
        await dataset.pushData(exampleData);
        require('../examples/map_and_reduce/map.js');
        await exampleFunc();

        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('pages_with_more_than_5_headers');
        expect(storeValue).toBeDefined();
        expect(Array.isArray(storeValue)).toBe(true);
        expect(storeValue.length).toBe(2);

        await dataset.drop();
    });

    test('reduce example works', async () => {
        const dataset = await Apify.openDataset();
        await dataset.pushData(exampleData);
        require('../examples/map_and_reduce/reduce.js');
        await exampleFunc();

        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('pages_heading_count');
        expect(storeValue).toBeDefined();
        expect(storeValue).toBe(23);

        await dataset.drop();
    });

    test('playwright crawler example works', async () => {
        require('../examples/playwright_crawler/playwright_crawler.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((item) => {
            expect(item).toBeDefined();
            expect(item).toHaveProperty('title');
            expect(item.title).toBeTruthy();
            expect(item).toHaveProperty('rank');
            expect(item.rank).toBeTruthy();
            expect(item).toHaveProperty('href');
            expect(item.href).toBeTruthy();
        });
    });

    test('puppeteer crawler example works', async () => {
        require('../examples/puppeteer_crawler/puppeteer_crawler.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((item) => {
            expect(item).toBeDefined();
            expect(item).toHaveProperty('title');
            expect(item.title).toBeTruthy();
            expect(item).toHaveProperty('rank');
            expect(item.rank).toBeTruthy();
            expect(item).toHaveProperty('href');
            expect(item.href).toBeTruthy();
        });
    });

    test('puppeteer with proxy example works', async () => {
        require('../examples/puppeteer_with_proxy/puppeteer_with_proxy.js');
        await exampleFunc();

        const titleLog = logs.find((log) => log.includes('Page title:'));
        expect(titleLog).toBeDefined();
        const title = titleLog.split(':')[1];
        expect(title).toBeTruthy();
    });

    test('synchronous run example works', async () => {
        require('../examples/synchronous_run/synchronous_run.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((text) => {
            expect(typeof text).toBe('string');
            expect(text).toBeTruthy();
            expect(text.includes('Did you know')).toBe(true);
        });
    });

    test('use stealth mode code works', async () => {
        require('../examples/use_stealth_mode/use_stealth_mode.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((item) => {
            expect(item).toBeDefined();
            expect(item).toHaveProperty('title');
            expect(item.title).toBeTruthy();
        });
    });
});
