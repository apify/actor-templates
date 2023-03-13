import { Actor } from 'apify';
import log from '@apify/log';
import { Dictionary } from 'apify-client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { collectAttachmentPaths, transformToTabular } from './transform';

function ensureFolder(pathname: string) {
    if (!fs.existsSync(pathname)) {
        fs.mkdirSync(pathname, { recursive: true });
    }
}

const getConfig = (options: {screen: {width: number, height: number}, headful: boolean, timeout: number, locale: string, darkMode: boolean, ignoreHTTPSErrors: boolean, video: string}) => {
    const {screen, headful, timeout, ignoreHTTPSErrors, darkMode, locale, video} = options;

    return `import { defineConfig } from '@playwright/test';
export default defineConfig({
    timeout: ${timeout},
    use: {
        headless: ${!headful},
        viewport: { width: ${screen.width}, height: ${screen.height} },
        ignoreHTTPSErrors: ${ignoreHTTPSErrors},
        colorScheme: '${darkMode ? 'dark' : 'light'}',
        locale: '${locale}',
        video: '${video}',
    },
    reporter: [
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results.json' }]
    ],
});`
}

function runTests() {
    try {
        execSync(`npx playwright test --config=${__dirname}/playwright.config.ts`, {
            cwd: __dirname,
            encoding: 'utf8',
            stdio: 'inherit',
        });
    } catch (e) {
        // suppress error, the report will be generated anyway
    }
}

function storeTestCode(args: { contents: string, path: string }) {
    return fs.writeFileSync(args.path, args.contents as string, { encoding: 'utf-8' });
}

function updateConfig(args: {
    screenWidth?: number,
    screenHeight?: number,
    headful?: boolean,
    timeout?: number,
    darkMode?: boolean,
    locale?: string,
    ignoreHTTPSErrors?: boolean,
    video?: string,
}) {
    const { 
        screenWidth = 1280, 
        screenHeight =  720,
        headful = false,
        timeout = 60,
        darkMode = false,
        locale = 'en-US',
        ignoreHTTPSErrors = true,
        video = 'off'
    } = args;

    const config = getConfig({screen: { width: screenWidth, height: screenHeight }, headful, timeout: timeout * 1000, locale, darkMode, ignoreHTTPSErrors, video});
    fs.writeFileSync(path.join(__dirname, 'playwright.config.ts'), config, { encoding: 'utf-8' });
}

(async () => {
    await Actor.init();
    const input = (await Actor.getInput() ?? {}) as Dictionary;

    if(!input.testCode) {
        if (process.argv[2] && process.argv[2].startsWith('--test-path') && process.argv[3]) {
            const filepath = process.argv[3];

            console.log('Reading test code from file: ', filepath);
            input.testCode = fs.readFileSync(filepath, { encoding: 'utf-8' });
        } else {
            throw new Error(`No test code provided!
Pass the code either as Apify input ('testCode' field) or as a file path argument.

Example:
    npm start -- -- --test-path /path/to/test.ts
                
                --- OR ---

    npm run start:prod -- --test-path /path/to/test.ts
`);
        }
    }

    ensureFolder(path.join(__dirname, 'tests'));

    storeTestCode({
        contents: input['testCode'] as string,
        path: path.join(__dirname, 'tests', 'test.spec.ts')
    });

    updateConfig(input);
    runTests();

    const kvs = await Actor.openKeyValueStore();

    ensureFolder(path.join(__dirname, '..', 'playwright-report'));
    await kvs.setValue('report', fs.readFileSync(path.join(__dirname, '..', 'playwright-report', 'index.html'), { encoding: 'utf-8' }), { contentType: 'text/html' });

    const jsonReport = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-results.json'), { encoding: 'utf-8' }));
    const attachmentPaths = collectAttachmentPaths(jsonReport);

    const attachmentLinks = await Promise.all(attachmentPaths.map(async (x) => {
        const attachment = fs.readFileSync(x.path);
        await kvs.setValue(x.key, attachment, { contentType: x.type ?? 'application/octet' });
        return {...x, url: await kvs.getPublicUrl(x.key)};
    }));

    await Actor.pushData(transformToTabular(jsonReport, attachmentLinks));
    
    const reportURL = await kvs.getPublicUrl('report');
    log.info('The test run has finished! The report is available in the Output tab or at the link below:');
    console.log(reportURL);
    
    await Actor.exit();
})();
