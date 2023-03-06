const fs = require('fs');
const sinon = require('sinon');
const path = require('path');
const { ENV_VARS } = require('@apify/consts');
const { spawnSync } = require('child_process');
const loadJson = require('load-json-file');
const rimraf = require('rimraf');
const copy = require('recursive-copy');
const { TEMPLATE_IDS } = require('../src/consts');

const TEST_ACTORS_FOLDER = 'test-actors';
const APIFY_LATEST_VERSION = spawnSync('npm', ['view', 'apify', 'version']).stdout.toString().trim();

const checkTemplateStructure = async (actorName, templateId) => {
    process.chdir(actorName);
    spawnSync('npm', ['install']);
    process.chdir('../');

    // Check files structure
    expect(fs.existsSync(actorName)).toBe(true);
    // Python templates do not have package.json, but have requirements.txt
    if (!/python/i.test(actorName)) {
        expect(fs.existsSync(path.join(actorName, 'package.json'))).toBe(true);
    } else {
        expect(fs.existsSync(path.join(actorName, 'requirements.txt'))).toBe(true);
    }

    const actorJsonPath = path.join(actorName, '.actor/actor.json');
    expect(fs.existsSync(actorJsonPath)).toBe(true);
    const actorJson = JSON.parse(fs.readFileSync(actorJsonPath, 'utf8'));
    expect(actorJson.meta?.templateId).toBe(templateId);

    // python templates do not use apify package
    if (!/python/i.test(actorName) && !/v2/i.test(actorName)) {
        // Check if template has the latest apify package version
        const apifyModulePackageJson = path.join(actorName, 'node_modules', 'apify', 'package.json');
        expect(loadJson.sync(apifyModulePackageJson).version).toEqual(APIFY_LATEST_VERSION);
    }

    // Check if actor was created without errors
    expect(console.log.args.map((arg) => arg[0])).not.toContain('Error:');
};

const checkTemplateRun = async (actorName) => {
    process.chdir(actorName);
    spawnSync('apify', ['run']);
    process.chdir('../');
    // Check if actor run without errors
    expect(console.log.args.map((arg) => arg[0])).not.toContain('Error:');
};

let prevEnvHeadless;

describe('templates', () => {
    beforeAll(async () => {
        prevEnvHeadless = process.env[ENV_VARS.HEADLESS];
        process.env[ENV_VARS.HEADLESS] = '1';

        if (!fs.existsSync(TEST_ACTORS_FOLDER)) fs.mkdirSync(TEST_ACTORS_FOLDER);
        process.chdir(TEST_ACTORS_FOLDER);
    });

    afterAll(async () => {
        process.env[ENV_VARS.HEADLESS] = prevEnvHeadless;

        process.chdir('../');
        if (fs.existsSync(TEST_ACTORS_FOLDER)) rimraf.sync(TEST_ACTORS_FOLDER);
    });

    beforeEach(() => {
        sinon.spy(console, 'log');
    });

    afterEach(() => {
        console.log.restore();
    });

    TEMPLATE_IDS.forEach((templateId) => {
        test(`${templateId} works`, async () => {
            const actorName = `cli-test-${templateId}`;
            await copy(`../templates/${templateId}`, actorName, { dot: true });
            await checkTemplateStructure(actorName, templateId);
            await checkTemplateRun(actorName);
        });
    });
});
