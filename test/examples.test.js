const Apify = require('apify');
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

describe('Examples - testing runnable codes behaviour ', () => {
    let localStorageEmulator;
    let exampleFunc; let
        callData;
    let dataSetData = []; let kvStoreData = []; let
        logs = [];

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
            Array.isArray(data) ? dataSetData = data : dataSetData.push(data);
        };
        Apify.call = (act, input) => {
            callData = { act, input };
        };
        console.log = (log) => {
            logs.push(log);
        };
    });

    beforeEach(async () => {
        localStorageEmulator = new LocalStorageDirEmulator();
        await localStorageEmulator.init();
        const queue = await Apify.openRequestQueue();
        await queue.drop();
    });


    afterEach(async () => {
        await localStorageEmulator.clean();
        dataSetData = [];
        kvStoreData = [];
        logs = [];
        callData = null;
    });

    afterAll(async () => {
        await localStorageEmulator.destroy();
        process.env[ENV_VARS.HEADLESS] = prevEnvHeadless;
    });

    test('should accept user input example runnable code works', async () => {
        const kvStore = await Apify.openKeyValueStore();
        const input = { test: 'testing input' };
        await kvStore.setValue('INPUT', input);

        await require('../examples/accept_user_input/accept_user_input.js');
        await exampleFunc();

        expect(logs.length).toBe(1);
        const savedInput = logs[0];
        expect(typeof savedInput).toBe('object');
        expect(savedInput).toHaveProperty('test');
        const { test } = savedInput;
        expect(test).toBe('testing input');

        await kvStore.drop();
    });

    test('should add data to dataset example runnable code works', async () => {
        await require('../examples/add_data_to_dataset/add_data_to_dataset.js');
        await exampleFunc();

        const dataset = await Apify.openDataset('my-cool-dataset');
        const data = await dataset.getData();

        const { items } = data;
        expect(items.length).toBe(3);
        items.forEach((result) => {
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('url');
            expect(result.url).toBeTruthy();
        });

        await dataset.drop();
    });

    test('should basic crawler example runnable code works', async () => {
        await require('../examples/basic_crawler/basic_crawler.js');
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

    test('should call actor example runnable code works', async () => {
        const originalGetUser = Apify.client.users.getUser;
        Apify.client.users.getUser = () => {
            return {
                email: 'jan.barta@apify.com',
            };
        };
        await require('../examples/call_actor/call_actor.js');
        await exampleFunc();

        const { email } = await Apify.client.users.getUser();
        const { input } = callData;
        const { to, html } = input;

        expect(to).toBe(email);
        expect(html).toBeTruthy();
        expect(html.includes('<div class="key">Last</div>')).toBe(true);
        expect(html.includes('<div class="key">High</div>')).toBe(true);
        expect(html.includes('<div class="key">Low</div>')).toBe(true);
        expect(html.includes('<div class="key">24 Hour Volume</div>')).toBe(true);
        expect(html.includes('<div class="key">Weighted Avg</div>')).toBe(true);

        Apify.client.users.getUser = originalGetUser;
    });

    test('should capture screenshot - puppeteer page screenshot example runnable code works', async () => {
        await require('../examples/capture_screenshot/puppeteer_page_screenshot.js');
        await exampleFunc();

        expect(kvStoreData.length).toBe(1);
        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('my-key');
        expect(storeValue).toBeDefined();
        expect(Buffer.isBuffer(storeValue)).toBe(true);
    });

    // TODO check if forEach is not the problem
    test('should capture screenshot - puppeteer apify snapshot example runnable code works', async () => {
        await require('../examples/capture_screenshot/puppeteer_apify_snapshot.js');
        await exampleFunc();

        const store = await Apify.openKeyValueStore();
        await store.forEachKey(async (key) => {
            const storeValue = await store.getValue(key);
            expect(storeValue).toBeDefined();
            expect(Buffer.isBuffer(storeValue)).toBe(true);
        });
        await store.drop();
    });

    test('should capture screenshot - puppeteer crawler page screenshot example runnable code works', async () => {
        await require('../examples/capture_screenshot/puppeteer_crawler_page_screenshot.js');
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

    // TODO check if forEach is not the problem
    test('should capture screenshot - puppeteer crawler apify snapshot example runnable code works', async () => {
        await require('../examples/capture_screenshot/puppeteer_crawler_apify_snapshot.js');
        await exampleFunc();

        const store = await Apify.openKeyValueStore();
        let items = 0;
        await store.forEachKey(async (key) => {
            items++;
            const storeValue = await store.getValue(key);
            expect(storeValue).toBeDefined();
            expect(Buffer.isBuffer(storeValue)).toBe(true);
        });
        expect(items).toBe(4);
        await store.drop();
    });

    test('should cheerio crawler example runnable code works', async () => {
        await require('../examples/cheerio_crawler/cheerio_crawler.js');
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

    test('should crawl sitemap - basic crawler example runnable code works', async () => {
        await require('../examples/crawl_sitemap/crawl_sitemap_basic.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('should crawl sitemap - cheerio crawler example runnable code works', async () => {
        await require('../examples/crawl_sitemap/crawl_sitemap_cheerio.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('should crawl sitemap - puppeteer crawler example runnable code works', async () => {
        await require('../examples/crawl_sitemap/crawl_sitemap_puppeteer.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('should crawl all links - cheerio crawler example runnable code works', async () => {
        await require('../examples/crawl_all_links/crawl_all_links_cheerio.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('should crawl all links - puppeteer crawler example runnable code works', async () => {
        await require('../examples/crawl_all_links/crawl_all_links_puppeteer.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('should crawl multiple urls - basic crawler example runnable code works', async () => {
        await require('../examples/crawl_multiple_urls/crawl_multiple_urls_basic.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBe(3);
    });

    test('should crawl multiple urls - cheerio crawler example runnable code works', async () => {
        await require('../examples/crawl_multiple_urls/crawl_multiple_urls_cheerio.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBe(3);
    });

    test('should crawl multiple urls - puppeteer crawler example runnable code works', async () => {
        await require('../examples/crawl_multiple_urls/crawl_multiple_urls_puppeteer.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBe(3);
    });

    test('should crawl relative links example runnable code works', async () => {
        await require('../examples/crawl_relative_links/crawl_relative_links.js');
        await exampleFunc();

        const crawledUrls = logs.filter(log => log.match(urlRegex));
        expect(crawledUrls.length).toBeGreaterThan(0);
    });

    test('should crawl single url example runnable code works', async () => {
        await require('../examples/crawl_single_url/crawl_single_url.js');
        await exampleFunc();

        expect(logs.length).toBe(1);
        const body = logs[0];
        expect(body).toBeTruthy();
        expect(body.includes('<html>'));
    });

    test('should crawl some links - cheerio example runnable code works', async () => {
        await require('../examples/crawl_some_links/crawl_some_links_cheerio.js');
        await exampleFunc();

        const successPages = logs.filter(log => log.includes('https://apify.com/'));
        expect(successPages.length).toBeGreaterThan(0);
    });

    test('should forms example runnable code works', async () => {
        await require('../examples/forms/forms.js');
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

    test('should handle broken links example runnable code works', async () => {
        await require('../examples/handle_broken_links/handle_broken_links.js');
        await exampleFunc();

        const successPages = logs.filter(log => log.includes('[success]'));
        expect(successPages.length).toBe(2);
        const failedPages = logs.filter(log => log.includes('[failed]'));
        expect(failedPages.length).toBe(1);
    });

    test('should puppeteer recursive crawl example runnable code works', async () => {
        await require('../examples/puppeteer_recursive_crawl/puppeteer_recursive_crawl.js');
        await exampleFunc();

        const titles = logs.filter(log => log.includes('Title of'));
        expect(titles.length).toBeGreaterThan(0);
    });

    test('should map example runnable code works', async () => {
        const dataset = await Apify.openDataset();
        await dataset.pushData(exampleData);
        await require('../examples/map_and_reduce/map.js');
        await exampleFunc();

        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('pages_with_more_than_5_headers');
        expect(storeValue).toBeDefined();
        expect(Array.isArray(storeValue)).toBe(true);
        expect(storeValue.length).toBe(2);

        await dataset.drop();
    });

    test('should reduce example runnable code works', async () => {
        const dataset = await Apify.openDataset();
        await dataset.pushData(exampleData);
        await require('../examples/map_and_reduce/reduce.js');
        await exampleFunc();

        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('pages_heading_count');
        expect(storeValue).toBeDefined();
        expect(storeValue).toBe(23);

        await dataset.drop();
    });


    test('should puppeteer crawler example runnable code works', async () => {
        await require('../examples/puppeteer_crawler/puppeteer_crawler.js');
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

    test('should puppeteer sitemap example runnable code works', async () => {
        await require('../examples/puppeteer_sitemap/puppeteer_sitemap.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((item) => {
            expect(item).toBeDefined();
            expect(item).toHaveProperty('url');
            expect(item.url).toBeTruthy();
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('html');
            expect(item.html).toBeTruthy();
        });
    });

    test('should puppeteer with proxy example runnable code works', async () => {
        await require('../examples/puppeteer_with_proxy/puppeteer_with_proxy.js');
        await exampleFunc();

        const titleLog = logs.find(log => log.includes('Page title:'));
        expect(titleLog).toBeDefined();
        const title = titleLog.split(':')[1];
        expect(title).toBeTruthy();
    });

    test('should screenshots example runnable code works', async () => {
        const kvStore = await Apify.openKeyValueStore();
        const input = { sources: [{ url: 'https://www.google.com' }, { url: 'https://www.duckduckgo.com' }] };
        await kvStore.setValue('INPUT', input);

        await require('../examples/screenshots/screenshots.js');
        await exampleFunc();

        const { sources } = input;
        sources.forEach((source) => {
            const { url } = source;
            const key = url.replace(/[:/]/g, '_');

            const sourceValue = kvStoreData.find(item => item.key === key);
            expect(sourceValue).toBeDefined();

            const { storeValue } = sourceValue;
            expect(Buffer.isBuffer(storeValue)).toBe(true);
        });
    });

    test('should synchronous run example runnable code works', async () => {
        await require('../examples/synchronous_run/synchronous_run.js');
        await exampleFunc();

        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach((text) => {
            expect(typeof text).toBe('string');
            expect(text).toBeTruthy();
            expect(text.includes('Did you know')).toBe(true);
        });
    });
});
