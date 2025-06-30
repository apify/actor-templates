import prettier from 'eslint-config-prettier';
import globals from 'globals';

import apifyJs from '@apify/eslint-config/js.js';

// eslint-disable-next-line import/no-default-export
export default [
    { ignores: ['**/dist', '**/venv', '**/.venv', 'templates', 'src', 'node_modules'] },
    ...apifyJs,
    prettier,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            'no-console': 0,
        },
    },
];
