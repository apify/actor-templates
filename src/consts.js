const path = require('path');

const TEMPLATE_IDS = require('../templates/manifest.json').templates.map((t) => t.id);

const TEMPLATES_DIR_NAME = 'templates';
const EXAMPLES_DIR_NAME = 'examples';
const DIST_DIR_NAME = 'dist';
const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'tmp', 'local-emulation-dir');

module.exports = {
    TEMPLATE_IDS,
    TEMPLATES_DIR_NAME,
    EXAMPLES_DIR_NAME,
    LOCAL_STORAGE_DIR,
    DIST_DIR_NAME,
};
