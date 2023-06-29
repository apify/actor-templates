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

function getConfigPath(){
    return `${__dirname}/../playwright.config.ts`;
}

function getResultDir(){
    return `${__dirname}/../playwright-report`;
}

const getConfig = (options: {screen: {width: number, height: number}, headful: boolean, timeout: number, locale: string, darkMode: boolean, ignoreHTTPSErrors: boolean, video: string}) => {
    const {screen, headful, timeout, ignoreHTTPSErrors, darkMode, locale, video} = options;

    return `
// Watch out! This file gets regenerated on every run of the actor.
// Any changes you make will be lost.

// Tweak your configuration through the Actor's input through the Apify console or directly in the \`input.json\` file.
import { defineConfig } from '@playwright/test';
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
        ['html', { outputFolder: '${getResultDir()}', open: 'never' }],
        ['json', { outputFile: '${getResultDir()}/test-results.json' }]
    ],
});`
}
function runTests() {
    try {
        execSync(`npx playwright test --config=${getConfigPath()}`, {
            cwd: __dirname,
            encoding: 'utf8',
            stdio: 'inherit',
        });
    } catch (e) {
        // suppress error, the report will be generated anyway
    }
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
    fs.writeFileSync(getConfigPath(), config, { encoding: 'utf-8' });
}

(async () => {
    await Actor.init();
    const input = (await Actor.getInput() ?? {}) as Dictionary;

    ensureFolder(getResultDir());
    updateConfig(input);

    runTests();

    const kvs = await Actor.openKeyValueStore();
    await kvs.setValue('report', fs.readFileSync(path.join(getResultDir(), 'index.html'), { encoding: 'utf-8' }), { contentType: 'text/html' });
    const jsonReport = JSON.parse(fs.readFileSync(path.join(getResultDir(), 'test-results.json'), { encoding: 'utf-8' }));
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
