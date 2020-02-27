# Contributing to actor-templates

## Tests

Tests are implemented using the [Mocha](https://mochajs.org/) framework.
You can run tests with commands in the repository root directory:

1. Install all dependencies:
`npm install`

2. Run tests using:
`npm run test`

## Publish new/updated templates

1. Templates are publishing automatically after committing to master branch or after merging pull requests.
This happens with Github actions.

2. If you want to add some templates or rename some, you need to change all actor templates list on [apify shared package](https://github.com/apifytech/apify-shared-js).
