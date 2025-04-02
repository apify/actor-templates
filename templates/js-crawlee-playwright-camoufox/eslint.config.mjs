import eslintPrettierConfig from 'eslint-config-prettier';

import apifyJsConfig from '@apify/eslint-config/js.js';

// eslint-disable-next-line import/no-default-export
export default [
    { ignores: ['**/dist'] }, // Ignores need to happen first
    ...apifyJsConfig,
    eslintPrettierConfig,
    {
        // Rules part
        files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],

        rules: {
            // Reason why this is enabled belongs here
            'max-len': [
                'error',
                {
                    code: 120,
                    // ignoreComments: true,
                },
            ],
        },
    },
];
