# Contributing to actor-templates

## Before you start

Issues labeled [`good first issue`](https://github.com/apify/actor-templates/labels/good%20first%20issue) or [`help wanted`](https://github.com/apify/actor-templates/labels/help%20wanted) are open to anyone. You don't need our permission to pick one up — comment on it so two people don't solve the same problem, and we'll assign it to you.

Check in on the issue first if it carries neither label. Most of those are on our roadmap, still in design, or part of a larger epic, so an unassigned issue isn't an open invitation. We'd rather answer a comment than close your PR.

## Tests

Tests are implemented using the [Jest](https://jestjs.io/) framework.
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
 export default {
     // ...
+    verbose: true,
 };
```

## Publish new/updated templates

1. Templates are publishing automatically after committing to master branch or after merging pull requests.
   This happens with Github actions.

2. If you want to add some templates or rename some, you need to change all Actor templates list on [apify shared package](https://github.com/apify/apify-shared-js).
