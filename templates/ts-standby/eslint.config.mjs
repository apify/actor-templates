import eslintPrettierConfig from 'eslint-config-prettier';

import apifyTypescriptConfig from '@apify/eslint-config/ts.js';

// eslint-disable-next-line import/no-default-export
export default [
    { ignores: ['**/dist'] }, // Ignores need to happen first
    ...apifyTypescriptConfig,
    eslintPrettierConfig,
    {
        languageOptions: {
            sourceType: 'module',
            parserOptions: {
                project: 'tsconfig.json',
            },
        },
    },
    {
        // Rules part
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],

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
