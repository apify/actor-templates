import { spawnSync as _spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import JSON5 from 'json5';
import semver from 'semver';

import { AGENT_AI_TEMPLATE_IDS, NODE_TEMPLATE_IDS, PYTHON_TEMPLATE_IDS, SKIP_TESTS } from '../src/consts.js';

const TEMPLATES_DIRECTORY = path.join(import.meta.dirname, '../templates');

const NPM_COMMAND = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const PYTHON_COMMAND = /^win/.test(process.platform) ? 'python' : 'python3';
const PYTHON_VENV_COMMAND = /^win/.test(process.platform) ? '.venv\\Scripts\\python.exe' : '.venv/bin/python3';
const APIFY_COMMAND = /^win/.test(process.platform) ? 'apify.cmd' : 'apify';

const windowsOptions = /^win/.test(process.platform) ? { shell: true, windowsHide: true } : {};

function spawnSync(command, args, options = {}) {
    return _spawnSync(command, args, { ...options, ...windowsOptions });
}

// `npm view apify version` from a tmp dir gives us the absolute latest version
// the registry reports — used below to assert each template installs a
// reasonably current minor of apify. We can't use it for strict equality
// against per-template `npm install` results: npm view fetches `dist-tags`
// fresh from the registry, but `npm install` with a semver range like
// `^3.7.0` fetches the full `/apify` package document, which can be served
// from a stale CDN edge for several minutes after a publish. During that
// propagation window the two paths disagree (view → 3.7.2, install → 3.7.1)
// and a strict equality check flakes on every SDK release.
//
// The check now is "installed version satisfies ^latest-major.0.0" — that
// catches templates pinning to an old MAJOR while tolerating the patch-level
// inconsistency between the registry and the install endpoint.
//
// cwd = tmpdir so the repo's devEngines.packageManager=pnpm doesn't block
// npm with EBADDEVENGINES.
const APIFY_SDK_JS_LATEST_VERSION = spawnSync(NPM_COMMAND, ['view', 'apify', 'version'], {
    cwd: os.tmpdir(),
})
    .stdout.toString()
    .trim();

const APIFY_SDK_PYTHON_LATEST_VERSION = spawnSync(PYTHON_COMMAND, ['-m', 'pip', 'index', 'versions', 'apify'])
    .stdout.toString()
    .match(/\((.*)\)/)[1];

const checkSpawnResult = ({ status, stdout, stderr }) => {
    if (stdout?.toString()) {
        console.log('stdout', stdout.toString());
    }

    if (stderr?.toString()) {
        console.log('stderr', stderr?.toString());
    }

    expect(status).toBe(0);
};

const checkCommonTemplateStructure = (templateId) => {
    const actorJsonPath = path.join('.actor', 'actor.json');
    expect(fs.existsSync(actorJsonPath)).toBe(true);

    const actorJson = JSON5.parse(fs.readFileSync(actorJsonPath, 'utf8'));
    expect(actorJson.meta?.templateId).toBe(templateId);
    expect(actorJson.meta?.generatedBy).toBeDefined();

    const readmePath = path.join('README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const agentMdPath = path.join('AGENTS.md');
    expect(fs.existsSync(agentMdPath)).toBe(true);

    // In order to detect if user changed the readme of his actor, we add a comment to the readme
    const readme = fs.readFileSync(readmePath, 'utf8');
    expect(readme).toContain('<!-- This is an Apify template readme -->');
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
        console.log(
            `Skipping ${templateId} because it requires Node.js ${requiredNodeVersion} and you have ${currentNodeVersion}`,
        );
        return false;
    }

    return true;
};

const checkNodeTemplate = () => {
    expect(fs.existsSync('package.json')).toBe(true);

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const npmInstallSpawnResult = spawnSync(NPM_COMMAND, ['install']);
    checkSpawnResult(npmInstallSpawnResult);

    if (packageJson.scripts?.lint) {
        const lintSpawnResult = spawnSync(NPM_COMMAND, ['run', 'lint']);
        checkSpawnResult(lintSpawnResult);
    }

    if (packageJson.scripts?.['format:check']) {
        const lintSpawnResult = spawnSync(NPM_COMMAND, ['run', 'format:check']);
        checkSpawnResult(lintSpawnResult);
    }

    const apifyModulePackageJsonPath = path.join('node_modules', 'apify', 'package.json');
    const apifyModulePackageJson = JSON.parse(fs.readFileSync(apifyModulePackageJsonPath, 'utf8'));

    // Tolerant of npm's view-vs-install CDN-propagation lag right after an SDK
    // release: as long as the installed version is on the latest major, we're
    // good. Strict equality against APIFY_SDK_JS_LATEST_VERSION would flake
    // because `npm view` (used to compute APIFY_SDK_JS_LATEST_VERSION) sees the
    // freshly-published patch sooner than `npm install` (used here) does.
    const expectedRange = `^${semver.major(APIFY_SDK_JS_LATEST_VERSION)}.0.0`;
    expect(semver.satisfies(apifyModulePackageJson.version, expectedRange)).toBe(true);
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
    const apifyRunSpawnResult = spawnSync(APIFY_COMMAND, ['run', '--allow-missing-secrets'], {
        env: { ...process.env, APIFY_HEADLESS: '1' },
        stdio: ['pipe', 'inherit', 'inherit'],
    });
    checkSpawnResult(apifyRunSpawnResult);
};

const prepareActor = (templateId) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), templateId));
    fs.cpSync(path.join(TEMPLATES_DIRECTORY, templateId), tmpDir, { recursive: true });
    process.chdir(tmpDir);
};

describe('templates-work', () => {
    describe('python-templates', () => {
        PYTHON_TEMPLATE_IDS.filter((templateId) => !SKIP_TESTS.includes(templateId))
            // Skip AI templates
            .filter((templateId) => !AGENT_AI_TEMPLATE_IDS.includes(templateId))
            .forEach((templateId) => {
                test(templateId, () => {
                    prepareActor(templateId);

                    checkCommonTemplateStructure(templateId);
                    checkPythonTemplate();
                    checkTemplateRun();
                });
            });
    });

    describe('node-js-templates', () => {
        NODE_TEMPLATE_IDS.filter((templateId) => !SKIP_TESTS.includes(templateId))
            // Skip AI templates
            .filter((templateId) => !AGENT_AI_TEMPLATE_IDS.includes(templateId))
            .forEach((templateId) => {
                test(templateId, () => {
                    prepareActor(templateId);

                    checkCommonTemplateStructure(templateId);
                    if (!canNodeTemplateRun(templateId)) return;

                    checkNodeTemplate();
                    checkTemplateRun();
                });
            });
    });

    describe('python-llm-ai-templates', () => {
        for (const templateId of AGENT_AI_TEMPLATE_IDS) {
            if (SKIP_TESTS.includes(templateId)) continue;

            if (PYTHON_TEMPLATE_IDS.includes(templateId)) {
                test(templateId, () => {
                    prepareActor(templateId);

                    checkCommonTemplateStructure(templateId);
                    checkPythonTemplate();
                    checkTemplateRun();
                });
            }
        }
    });

    describe('node-js-llm-ai-templates', () => {
        for (const templateId of AGENT_AI_TEMPLATE_IDS) {
            if (SKIP_TESTS.includes(templateId)) continue;

            if (NODE_TEMPLATE_IDS.includes(templateId)) {
                test(templateId, () => {
                    prepareActor(templateId);

                    checkCommonTemplateStructure(templateId);
                    if (!canNodeTemplateRun(templateId)) return;

                    checkNodeTemplate();
                    checkTemplateRun();
                });
            }
        }
    });
});
