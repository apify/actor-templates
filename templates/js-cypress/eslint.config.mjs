import prettier from 'eslint-config-prettier';
// eslint-disable-next-line import/extensions
import pluginCypress from 'eslint-plugin-cypress/flat';

import apify from '@apify/eslint-config/js.js';

// eslint-disable-next-line import/no-default-export
export default [{ ignores: ['**/dist'] }, pluginCypress.configs.recommended, ...apify, prettier];
