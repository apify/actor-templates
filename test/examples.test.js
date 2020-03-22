const Apify = require('apify');


describe('Examples - testing runnable codes behaviour ', async () => {

    let exampleFunc, callData;
    let dataSetData, kvStoreData = [];
    const originalSetValue =  Apify.setValue;
    const originalPushData =  Apify.pushData;
    const originalCall = Apify.call;


    beforeAll(() => {
        Apify.main = (func ) => {
            exampleFunc = func
        };

        Apify.setValue  = (key, storeValue) => {
                kvStoreData.push({
                    key,
                    storeValue
                });
        };
        Apify.pushData = data => {
           Array.isArray(data) ? dataSetData = data : dataSetData.push(data);
        };
        Apify.call = (act, input) => {
            callData = { act, input };
        };
    });


    afterEach(async () => {
        const dataset = await Apify.openDataset();
        await dataset.drop();
        const kvStore = await Apify.openKeyValueStore();
        await kvStore.drop();
        dataSetData = [];
        kvStoreData = [];
        callData = null;
    });

    afterAll(() => {
        Apify.setValue = originalSetValue;
        Apify.pushData = originalPushData;
        Apify.call = originalCall;
    });


    test('should call actor example runnable code works', async () => {
        const { email } = await Apify.client.users.getUser();
        require('../examples/call_actor/call_actor.js');
        await exampleFunc();

        const { act, input } = callData;
        const { to , subject, html } = input;
        expect(act).toBe('apify/send-mail');
        expect(to).toBe(email);
        expect(subject).toBe('Kraken.com BTC');
        expect(html.includes('<div class="key">Last</div>')).toBe(true);
        expect(html.includes('<div class="key">High</div>')).toBe(true);
        expect(html.includes('<div class="key">Low</div>')).toBe(true);
        expect(html.includes('<div class="key">24 Hour Volume</div>')).toBe(true);
        expect(html.includes('<div class="key">Weighted Avg</div>')).toBe(true);
    });

    test('should forms example runnable code works', async () => {
        require('../examples/forms/forms.js');
        await exampleFunc();

        expect(dataSetData).toBeDefined();
        expect(Array.isArray(dataSetData)).toBe(true);
        expect(dataSetData.length).toBeGreaterThan(0);
        dataSetData.forEach( result => {
            expect(result).toBeInstanceOf(Object);
            expect(result).toHaveProperty('url');
            expect(result['url']).toBeTruthy();
            expect(result).toHaveProperty('name');
            expect(result['name']).toBeTruthy();
        });
    });

    test('should map example runnable code works', async () => {
        require('../examples/map_and_reduce/map.js');
        await exampleFunc();

        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('pages_with_more_than_5_headers');
        expect(storeValue).toBeDefined();
        expect(Array.isArray(storeValue)).toBe(true);
        expect(storeValue.length).toBe(2);

    });

    test('should reduce example runnable code works', async () => {
        require('../examples/map_and_reduce/reduce.js');
        await exampleFunc();

        const { key, storeValue } = kvStoreData[0];
        expect(key).toBe('pages_heading_count');
        expect(storeValue).toBeDefined();
        expect(storeValue).toBe(23);

    });

    test('should puppeteer sitemap example runnable code works', async () => {
        require('../examples/puppeteer_sitemap/puppeteer_sitemap.js');
        await exampleFunc();

        dataSetData.forEach( item => {
            expect(item).toBeDefined();
            expect(item).toHaveProperty('url');
            expect(item['url']).toBeTruthy();
            expect(item).toHaveProperty('title');
            expect(item['title']).toBeTruthy();
            expect(item).toHaveProperty('html');
            expect(item['html']).toBeTruthy();
        });
    });

    test('should puppeteer with proxy example runnable code works', async () => {
        const originalLog = console.log;
        let logs = [];
        console.log  = log => {
           logs.push(log);
        };
        require('../examples/puppeteer_with_proxy/puppeteer_with_proxy.js');
        await exampleFunc();

        expect(logs.length).toBe(4);
        expect(logs[1]).toBe('Running Puppeteer script...');
        expect(logs[2]).toBeDefined();
        const title = logs[2].split(':')[1];
        expect(title).toBeTruthy();
        expect(logs[3]).toBe('Puppeteer closed.');

        console.log = originalLog;
    });


    test('should screenshots example runnable code works', async () => {
        const kvStore = await Apify.openKeyValueStore();
        const input = { sources: [{ "url": "https://www.google.com" }, { "url": "https://www.duckduckgo.com" }] };
        await kvStore.setValue('INPUT', input );

        require('../examples/screenshots/screenshots.js');
        await exampleFunc();

        const { sources } = input;
        for (const source of sources) {
            const { url } = source;
            const key = url.replace(/[:/]/g, '_');

            const sourceValue = kvStoreData.find( item => item.key === key);
            expect(sourceValue).toBeDefined();

            const { storeValue } = sourceValue;

            expect(Buffer.isBuffer(storeValue)).toBe(true);
        }
    });

    test('should synchronous run example runnable code works', async () => {
        require('../examples/synchronous_run/synchronous_run.js');
        await exampleFunc();

        const kvStore = await Apify.openKeyValueStore();
        const { key, content } = kvStoreData[0];
        expect(Buffer.isBuffer(content)).toBe(true);

        const sourceValue = await kvStore.getValue(key);
        expect(sourceValue).toBeDefined();
        expect(Buffer.isBuffer(sourceValue)).toBe(true);
    });
});