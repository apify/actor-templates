const path = require('path');

const templateManifest = require('../templates/manifest.json');
const wrapperManifest = require('../wrappers/manifest.json');

const WRAPPER_IDS = wrapperManifest.templates.map((t) => t.id);
const TEMPLATE_IDS = templateManifest.templates.map((t) => t.id);
const NODE_TEMPLATE_IDS = templateManifest.templates.filter((t) => t.category === 'javascript' || t.category === 'typescript').map((t) => t.id);
const SKIP_TESTS = templateManifest.templates.filter((t) => t.skipTests).map((t) => t.id);
const PYTHON_TEMPLATE_IDS = templateManifest.templates.filter((t) => t.category === 'python').map((t) => t.id);

const AGENT_AI_TEMPLATE_IDS = templateManifest.templates.filter((t) => t.useCases?.includes('AI')).map((t) => t.id);

const TEMPLATES_DIR_NAME = 'templates';
const WRAPPERS_DIR_NAME = 'wrappers';
const EXAMPLES_DIR_NAME = 'examples';
const DIST_DIR_NAME = 'dist';
const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'tmp', 'local-emulation-dir');

module.exports = {
    TEMPLATE_IDS,
    NODE_TEMPLATE_IDS,
    SKIP_TESTS,
    PYTHON_TEMPLATE_IDS,
    TEMPLATES_DIR_NAME,
    EXAMPLES_DIR_NAME,
    LOCAL_STORAGE_DIR,
    DIST_DIR_NAME,
    WRAPPER_IDS,
    WRAPPERS_DIR_NAME,
    AGENT_AI_TEMPLATE_IDS,
};
