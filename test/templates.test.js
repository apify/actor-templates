const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const JSON5 = require('json5');
const semver = require('semver');

const { NODE_TEMPLATE_IDS, PYTHON_TEMPLATE_IDS } = require('../src/consts');

const TEMPLATES_DIRECTORY = path.join(__dirname, '../templates');

const NPM_COMMAND = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const PYTHON_COMMAND = /^win/.test(process.platform) ? 'python' : 'python3';
const PYTHON_VENV_COMMAND = /^win/.test(process.platform) ? '.venv\\Scripts\\python.exe' : '.venv/bin/python3';
const APIFY_COMMAND = /^win/.test(process.platform) ? 'apify.cmd' : 'apify';

const APIFY_SDK_JS_LATEST_VERSION = spawnSync(NPM_COMMAND, ['view', 'apify', 'version']).stdout.toString().trim();
const APIFY_SDK_PYTHON_LATEST_VERSION = spawnSync(PYTHON_COMMAND, ['-m', 'pip', 'index', 'versions', 'apify']).stdout.toString().match(/\((.*)\)/)[1];

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

const canNodeTemplateRun = (templateId) => {
    expect(fs.existsSync('package.json')).toBe(true);
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const currentNodeVersion = process.version;
    const requiredNodeVersion = packageJson.engines?.node;
    const requiredBunVersion = packageJson.engines?.bun;

    if (requiredBunVersion && !requiredNodeVersion) {
        console.log(`Skipping ${templateId} because it can only be run using bun.`);
        return false;
    }

    if (requiredNodeVersion && !semver.satisfies(currentNodeVersion, requiredNodeVersion)) {
        console.log(`Skipping ${templateId} because it requires Node.js ${requiredNodeVersion} and you have ${currentNodeVersion}`);
        return false;
    }

    return true;
};

const checkNodeTemplate = () => {
    expect(fs.existsSync('package.json')).toBe(true);

    /* TODO: uncomment this and fix lint everywhere
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts?.lint) {
        const lintSpawnResult = spawnSync(NPM_COMMAND, ['run', 'lint']);
        checkSpawnResult(lintSpawnResult);
    }
    */

    const npmInstallSpawnResult = spawnSync(NPM_COMMAND, ['install']);
    checkSpawnResult(npmInstallSpawnResult);

    const apifyModulePackageJsonPath = path.join('node_modules', 'apify', 'package.json');
    const apifyModulePackageJson = JSON.parse(fs.readFileSync(apifyModulePackageJsonPath, 'utf8'));

    expect(apifyModulePackageJson.version).toEqual(APIFY_SDK_JS_LATEST_VERSION);
};

const checkPythonTemplate = () => {
    expect(fs.existsSync('requirements.txt')).toBe(true);

    spawnSync(PYTHON_COMMAND, ['-m', 'venv', '.venv']);

    const pipInstallSpawnResult = spawnSync(PYTHON_VENV_COMMAND, ['-m', 'pip', 'install', '-r', 'requirements.txt']);
    checkSpawnResult(pipInstallSpawnResult);

    const pipShowApifySpawnResult = spawnSync(PYTHON_VENV_COMMAND, ['-m', 'pip', 'show', 'apify']);
    checkSpawnResult(pipShowApifySpawnResult);

    // If playwright is used in the template, we have to do a post-install step
    const pipShowPlaywrightSpawnResult = spawnSync(PYTHON_VENV_COMMAND, ['-m', 'pip', 'show', 'playwright']);
    if (pipShowPlaywrightSpawnResult.status === 0) {
        const playwrightInstallSpawnResult = spawnSync(PYTHON_VENV_COMMAND, ['-m', 'playwright', 'install']);
        checkSpawnResult(playwrightInstallSpawnResult);
    }

    const installedApifySdkVersion = pipShowApifySpawnResult.stdout.toString().match(/Version: (.*)/)[1];
    expect(installedApifySdkVersion).toEqual(APIFY_SDK_PYTHON_LATEST_VERSION);
};

const checkTemplateRun = () => {
    const apifyRunSpawnResult = spawnSync(APIFY_COMMAND, ['run'], { options: { env: { ...process.env, APIFY_HEADLESS: '1' } } });
    checkSpawnResult(apifyRunSpawnResult);
};

const prepareActor = (templateId) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), templateId));
    fs.cpSync(path.join(TEMPLATES_DIRECTORY, templateId), tmpDir, { recursive: true });
    process.chdir(tmpDir);
};

describe('Templates work', () => {
    describe('Python templates', () => {
        PYTHON_TEMPLATE_IDS.forEach((templateId) => {
            test(templateId, () => {
                prepareActor(templateId);

                checkCommonTemplateStructure(templateId);
                checkPythonTemplate();
                checkTemplateRun();
            });
        });
    });

    describe('Node.js templates', () => {
        NODE_TEMPLATE_IDS.forEach((templateId) => {
            test(templateId, () => {
                prepareActor(templateId);

                checkCommonTemplateStructure(templateId);
                if (!canNodeTemplateRun(templateId)) return;

                checkNodeTemplate();
                checkTemplateRun();
            });
        });
    });
});
