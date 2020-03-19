const Apify = require('apify');


describe('Examples - testing runnable codes behaviour ', () => {

    let exampleFunc;
    beforeAll(() => {
        Apify.main = (func ) => {
            exampleFunc = func
        };
    });


    test('should call actor example runnable code works', async () => {
        const originalCall =  Apify.call;
        let callInput;
        Apify.call = (act, input) => {
           callInput = {
               act,
               input,
           };
        };
        const { email } = await Apify.client.users.getUser();
        require('../examples/call_actor/call_actor.js');
        await exampleFunc();
        const { act, input } = callInput;
        const { to , subject, html } = input;

        expect(act).toBe('apify/send-mail');
        expect(to).toBe(email);
        expect(subject).toBe('Kraken.com BTC');
        expect(html.includes('<div class="key">Last</div>')).toBe(true);
        expect(html.includes('<div class="key">High</div>')).toBe(true);
        expect(html.includes('<div class="key">Low</div>')).toBe(true);
        expect(html.includes('<div class="key">24 Hour Volume</div>')).toBe(true);
        expect(html.includes('<div class="key">Weighted Avg</div>')).toBe(true);

        Apify.call = originalCall;
    });

    test('should forms example runnable code works', async () => {
        const originalPushData =  Apify.pushData;
        let data;
        Apify.pushData = (apifyData) => {
          data = apifyData;
        };
        require('../examples/forms/forms.js');
        await exampleFunc();

        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        data.forEach( result => {
            expect(result).toHaveProperty('url');
            expect(result['url']).toBeTruthy();
            expect(result).toHaveProperty('name');
            expect(result['name']).toBeTruthy();
        });

        Apify.pushData = originalPushData;
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
            const sourceValue = await kvStore.getValue(key);

            expect(sourceValue).toBeDefined();
            expect(Buffer.isBuffer(sourceValue)).toBe(true);
        }
    });
});