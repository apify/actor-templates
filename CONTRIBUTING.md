# Contributing to actor-templates

## Tests

Tests are implemented using the [Mocha](https://mochajs.org/) framework.
You can run tests with commands in the repository root directory:

Install dependencies:

```
npm install
```

Run tests for all templates:

```
npm run test
```

Run tests only for Python templates:

```
npm run test-python-templates
```

Run tests only for Node templates:

```
npm run test-node-templates
```

To enable verbose output, add `verbose: true` to the `jest.config.js` file:

```diff
 module.exports = {
     // ...
+    verbose: true,
 };
```

## Publish new/updated templates

1. Templates are publishing automatically after committing to master branch or after merging pull requests.
   This happens with Github actions.

2. If you want to add some templates or rename some, you need to change all Actor templates list on [apify shared package](https://github.com/apify/apify-shared-js).
