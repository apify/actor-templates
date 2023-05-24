const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { ENV_VARS } = require('@apify/consts');
const JSON5 = require('json5');

const { NODE_TEMPLATE_IDS, PYTHON_TEMPLATE_IDS } = require('../src/consts');

const TEST_ACTORS_FOLDER = 'test-actors';
const APIFY_SDK_JS_LATEST_VERSION = spawnSync('npm', ['view', 'apify', 'version']).stdout.toString().trim();
const APIFY_SDK_PYTHON_LATEST_VERSION = spawnSync('pip', ['index', 'versions', 'apify']).stdout.toString().match(/\((.*)\)/)[1];

const checkSpawnResult = ({ status, stdout, stderr }) => {
    try {
        expect(status).toBe(0);

        // `apify run` prints error message to stdout, but exits with code 0
        // TODO: after it is fixed in apify-cli, remove this
        // and switch to `stdio: inherit` in `spawnSync`
        expect(stdout.toString()).not.toMatch(/Error: .* exited with code .*/);
    } catch (err) {
        console.log(stderr.toString());
        console.log(stdout.toString());
        throw err;
    }
};

const checkCommonTemplateStructure = (templateId) => {
    const actorJsonPath = path.join('.actor', 'actor.json');
    expect(fs.existsSync(actorJsonPath)).toBe(true);

    const actorJson = JSON5.parse(fs.readFileSync(actorJsonPath, 'utf8'));
    expect(actorJson.meta?.templateId).toBe(templateId);
};

const checkNodeTemplate = () => {
    expect(fs.existsSync('package.json')).toBe(true);

    /* TODO: uncomment this and fix lint everywhere
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts?.lint) {
        const lintSpawnResult = spawnSync('npm', ['run', 'lint']);
        checkSpawnResult(lintSpawnResult);
    }
    */

    const npmInstallSpawnResult = spawnSync('npm', ['install']);
    checkSpawnResult(npmInstallSpawnResult);

    const apifyModulePackageJsonPath = path.join('node_modules', 'apify', 'package.json');
    const apifyModulePackageJson = JSON.parse(fs.readFileSync(apifyModulePackageJsonPath, 'utf8'));

    expect(apifyModulePackageJson.version).toEqual(APIFY_SDK_JS_LATEST_VERSION);
};

const checkPythonTemplate = () => {
    expect(fs.existsSync('requirements.txt')).toBe(true);

    spawnSync('python', ['-m', 'venv', '.venv']);

    const pipInstallSpawnResult = spawnSync('.venv/bin/python3', ['-m', 'pip', 'install', '-r', 'requirements.txt']);
    checkSpawnResult(pipInstallSpawnResult);

    const pipShowApifySpawnResult = spawnSync('.venv/bin/python3', ['-m', 'pip', 'show', 'apify']);
    checkSpawnResult(pipShowApifySpawnResult);

    // If playwright is used in the template, we have to do a post-install step
    const pipShowPlaywrightSpawnResult = spawnSync('.venv/bin/python3', ['-m', 'pip', 'show', 'playwright']);
    if (pipShowPlaywrightSpawnResult.status === 0) {
        const playwrightInstallSpawnResult = spawnSync('.venv/bin/python3', ['-m', 'playwright', 'install']);
        checkSpawnResult(playwrightInstallSpawnResult);
    }

    const installedApifySdkVersion = pipShowApifySpawnResult.stdout.toString().match(/Version: (.*)/)[1];
    expect(installedApifySdkVersion).toEqual(APIFY_SDK_PYTHON_LATEST_VERSION);
};

const checkTemplateRun = () => {
    const apifyRunSpawnResult = spawnSync('apify', ['run'], { options: { env: { ...process.env, [ENV_VARS.HEADLESS]: '1' } } });
    checkSpawnResult(apifyRunSpawnResult);
};

describe('Templates work', () => {
    let currentDir;

    beforeAll(async () => {
        currentDir = process.cwd();
        fs.rmSync(TEST_ACTORS_FOLDER, { recursive: true, force: true });
        fs.mkdirSync(TEST_ACTORS_FOLDER);
    });

    afterAll(async () => {
        process.chdir(currentDir);
        fs.rmSync(TEST_ACTORS_FOLDER, { recursive: true, force: true });
    });

    beforeEach(() => {
        process.chdir(path.join(currentDir, TEST_ACTORS_FOLDER));
    });

    describe('python templates', () => {
        PYTHON_TEMPLATE_IDS.forEach((templateId) => {
            test(templateId, () => {
                fs.cpSync(`../templates/${templateId}`, templateId, { recursive: true });
                process.chdir(templateId);
                checkCommonTemplateStructure(templateId);
                checkPythonTemplate(templateId);
                checkTemplateRun();
            });
        });
    });

    describe('node templates', () => {
        NODE_TEMPLATE_IDS.forEach((templateId) => {
            test(`${templateId} works`, () => {
                fs.cpSync(`../templates/${templateId}`, templateId, { recursive: true });
                process.chdir(templateId);
                checkCommonTemplateStructure(templateId);
                checkNodeTemplate(templateId);
                checkTemplateRun();
            });
        });
    });
});
