import path from 'node:path';

import templateManifest from '../templates/manifest.json' with { type: 'json' };
import wrapperManifest from '../wrappers/manifest.json' with { type: 'json' };

export const WRAPPER_IDS = wrapperManifest.templates.map((t) => t.id);
export const TEMPLATE_IDS = templateManifest.templates.map((t) => t.id);
export const NODE_TEMPLATE_IDS = templateManifest.templates
    .filter((t) => t.category === 'javascript' || t.category === 'typescript')
    .map((t) => t.id);
export const SKIP_TESTS = templateManifest.templates.filter((t) => t.skipTests).map((t) => t.id);
export const PYTHON_TEMPLATE_IDS = templateManifest.templates.filter((t) => t.category === 'python').map((t) => t.id);

export const AGENT_AI_TEMPLATE_IDS = templateManifest.templates
    .filter((t) => t.useCases?.includes('AI'))
    .map((t) => t.id);

export const TEMPLATES_DIR_NAME = 'templates';
export const WRAPPERS_DIR_NAME = 'wrappers';
export const EXAMPLES_DIR_NAME = 'examples';
export const DIST_DIR_NAME = 'dist';
export const LOCAL_STORAGE_DIR = path.join(import.meta.dirname, '..', 'tmp', 'local-emulation-dir');
