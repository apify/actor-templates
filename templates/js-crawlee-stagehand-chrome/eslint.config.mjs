import prettier from 'eslint-config-prettier';

import apify from '@apify/eslint-config/js.js';

// eslint-disable-next-line import/no-default-export
export default [{ ignores: ['**/dist'] }, ...apify, prettier];
