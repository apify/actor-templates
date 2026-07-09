import { spawnSync as _spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import JSON5 from 'json5';
import semver from 'semver';

import {
    AGENT_AI_TEMPLATE_IDS,
    NODE_TEMPLATE_IDS,
    PYTHON_TEMPLATE_IDS,
    SKIP_RUN_TESTS,
    SKIP_TESTS,
} from '../src/consts.js';

const TEMPLATES_DIRECTORY = path.join(import.meta.dirname, '../templates');

const NPM_COMMAND = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const PYTHON_COMMAND = /^win/.test(process.platform) ? 'python' : 'python3';
const PYTHON_VENV_COMMAND = /^win/.test(process.platform) ? '.venv\\Scripts\\python.exe' : '.venv/bin/python3';
// The apify CLI comes from this repo's devDependencies (lockfile-pinned, cached by
// the pnpm store) — use its .bin shim directly since the tests chdir into tmp dirs.
const APIFY_COMMAND = path.join(
    import.meta.dirname,
    '../node_modules/.bin',
    /^win/.test(process.platform) ? 'apify.cmd' : 'apify',
);

const windowsOptions = /^win/.test(process.platform) ? { shell: true, windowsHide: true } : {};

// Puppeteer templates download their pinned Chrome during `npm install`. Pin that to
// one explicit cache dir shared by the CI pre-install step, each template's install,
// and the later `apify run` — the default per-user cache is reused across templates,
// where a partial download from one poisons the next (mostly on Windows). Honor a
// workflow-provided value; fall back to a temp dir locally.
process.env.PUPPETEER_CACHE_DIR ||= path.join(os.tmpdir(), 'apify-templates-puppeteer-cache');
const { PUPPETEER_CACHE_DIR } = process.env;

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

    // Templates depending on puppeteer download Chrome during `npm install` (a
    // postinstall hook). That download can be flaky and leave a corrupt entry in
    // PUPPETEER_CACHE_DIR that wedges the install, so for those templates clear the
    // cache and retry a couple of times.
    const usesPuppeteer = Boolean(packageJson.dependencies?.puppeteer ?? packageJson.devDependencies?.puppeteer);

    let npmInstallSpawnResult = spawnSync(NPM_COMMAND, ['install']);
    for (let retry = 0; usesPuppeteer && retry < 2 && npmInstallSpawnResult.status !== 0; retry++) {
        console.log('npm install failed, clearing Puppeteer cache and retrying...');
        fs.rmSync(PUPPETEER_CACHE_DIR, { recursive: true, force: true });
        npmInstallSpawnResult = spawnSync(NPM_COMMAND, ['install']);
    }
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
        // Chromium only — the python templates don't use playwright's firefox/webkit
        // (camoufox fetches its own browser), and a bare `playwright install` pulls
        // all three (~350MB extra) on every playwright template.
        const playwrightInstallSpawnResult = spawnSync(PYTHON_VENV_COMMAND, [
            '-m',
            'playwright',
            'install',
            'chromium',
        ]);
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

// TEST_SHARD="2/4" (set by the CI matrix) makes this process run only its slice
// of each template list, so the serial install+run loop can be parallelized
// across jobs. Jest's own --shard splits by test *file* and this is a single
// file, hence the env var. Unset = run everything.
const [shardIndex, shardTotal] = (process.env.TEST_SHARD ?? '1/1').split('/').map(Number);

// Approximate per-template cost in Windows-runner minutes (the slowest leg),
// median over the Windows legs of runs 29044970343/29048231477/29050769423
// (2026-07). Used to balance the shards — exact values don't matter, relative
// size does. Unlisted templates default to 3.
const TEMPLATE_WEIGHTS = {
    'js-bootstrap-cheerio-crawler': 1.7,
    'js-crawlee-cheerio': 2.9,
    'js-crawlee-playwright-camoufox': 4.5,
    'js-crawlee-playwright-chrome': 5.2,
    'js-crawlee-puppeteer-chrome': 4.4,
    'js-cypress': 3.9,
    'js-empty': 1.6,
    'js-langchain': 7.2,
    'js-langgraph-agent': 4.8,
    'js-start': 1.0,
    'python-beautifulsoup': 0.7,
    'python-crawlee-beautifulsoup': 0.4,
    'python-crawlee-parsel': 0.4,
    'python-crawlee-playwright': 2.5,
    'python-crawlee-playwright-camoufox': 1.0,
    'python-empty': 0.3,
    'python-langgraph': 0.7,
    'python-llamaindex-agent': 1.2,
    'python-playwright': 3.6,
    'python-pydanticai': 1.7,
    'python-scrapy': 0.9,
    'python-selenium': 1.7,
    'python-smolagents': 1.3,
    'python-start': 0.5,
    'ts-beeai-agent': 3.5,
    'ts-crawlee-cheerio': 3.2,
    'ts-crawlee-playwright-camoufox': 4.8,
    'ts-crawlee-playwright-chrome': 5.7,
    'ts-crawlee-puppeteer-chrome': 4.6,
    'ts-empty': 1.9,
    'ts-mastraai': 5.9,
    'ts-start': 2.1,
    'ts-start-bun': 0,
};

// LPT scheduling: heaviest template first, each into the currently lightest
// shard. Deterministic (weight desc, then name), so every shard process computes
// the same partition without coordination.
const shardSlice = (templateIds) => {
    const loads = Array(shardTotal).fill(0);
    const shards = Array.from({ length: shardTotal }, () => []);
    const weight = (id) => TEMPLATE_WEIGHTS[id] ?? 3;
    const sorted = [...templateIds].sort((a, b) => weight(b) - weight(a) || a.localeCompare(b));
    for (const id of sorted) {
        const lightest = loads.indexOf(Math.min(...loads));
        loads[lightest] += weight(id);
        shards[lightest].push(id);
    }
    return shards[shardIndex - 1];
};

const prepareActor = (templateId) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), templateId));
    fs.cpSync(path.join(TEMPLATES_DIRECTORY, templateId), tmpDir, { recursive: true });
    process.chdir(tmpDir);
};

describe('templates-work', () => {
    describe('python-templates', () => {
        shardSlice(
            PYTHON_TEMPLATE_IDS.filter((templateId) => !SKIP_TESTS.includes(templateId))
                // Skip AI templates
                .filter((templateId) => !AGENT_AI_TEMPLATE_IDS.includes(templateId)),
        ).forEach((templateId) => {
            test(templateId, () => {
                prepareActor(templateId);

                checkCommonTemplateStructure(templateId);
                checkPythonTemplate();
                checkTemplateRun();
            });
        });
    });

    describe('node-js-templates', () => {
        shardSlice(
            NODE_TEMPLATE_IDS.filter((templateId) => !SKIP_TESTS.includes(templateId))
                // Skip AI templates
                .filter((templateId) => !AGENT_AI_TEMPLATE_IDS.includes(templateId)),
        ).forEach((templateId) => {
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
        shardSlice(
            AGENT_AI_TEMPLATE_IDS.filter((templateId) => !SKIP_TESTS.includes(templateId)).filter((templateId) =>
                PYTHON_TEMPLATE_IDS.includes(templateId),
            ),
        ).forEach((templateId) => {
            test(templateId, () => {
                prepareActor(templateId);

                checkCommonTemplateStructure(templateId);
                checkPythonTemplate();
                if (SKIP_RUN_TESTS.includes(templateId)) return;
                checkTemplateRun();
            });
        });
    });

    describe('node-js-llm-ai-templates', () => {
        shardSlice(
            AGENT_AI_TEMPLATE_IDS.filter((templateId) => !SKIP_TESTS.includes(templateId)).filter((templateId) =>
                NODE_TEMPLATE_IDS.includes(templateId),
            ),
        ).forEach((templateId) => {
            test(templateId, () => {
                prepareActor(templateId);

                checkCommonTemplateStructure(templateId);
                if (!canNodeTemplateRun(templateId)) return;

                checkNodeTemplate();
                if (SKIP_RUN_TESTS.includes(templateId)) return;
                checkTemplateRun();
            });
        });
    });
});
