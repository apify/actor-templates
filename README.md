<img src="actor-logo.png" align="right" />

# Apify Actor templates

> This repository stores boilerplate templates and code examples for [Apify Actor](https://apify.com/actors).
> The purpose of these templates is to help devlopers get started with actor development on the Apify platform.

## How to use the templates

You can start using the actor templates right away with the [Apify CLI](https://docs.apify.com/cli):

```Bash
npx apify-cli create my-crawler
```

or

```Bash
npm -g install apify-cli
apify create my-actor
```

After running the command you will be prompted to select one of the templates from the list displayed in your terminal. The available templates are:

### Getting started templates

Basic templates to start developing actors on the Apify platform using Node.js (JavaScript/Typescript), or Python.
Just install the CLI and watch your actor run.

- [Node.js + JavaScript](./templates/js-start/)
- [Node.js + TypeScript](./templates/ts-start/)
- [Python](./templates/python-start/)

You can find more code examples in the
[Apify SDK documentation](https://sdk.apify.com/docs/examples/puppeteer-crawler/).

### Project boilerplate

If you're already familiar with Actors, you can use the following templates to bootstrap new projects using an empty project templates or Crawlee templates:

#### Empty projects

Start a new web scraping project quickly and easily in JavaScript/TypeScript (Node.js) or Python with our empty project template. It provides a basic structure for the Actor with [Apify JavaScript SDK](https://docs.apify.com/sdk/js/) or [Apify Python SDK](https://docs.apify.com/sdk/python/) and allows you to easily add your own functionality.

- [Empty JavaScript project](./templates/js-empty/)
- [Empty TypeScript project](./templates/ts-empty/)
- [Empty Python project](./templates/python-empty/)

#### Crawlee projects

- [CheerioCrawler](./templates/js-crawlee-cheerio/) ([TypeScript version](./templates/ts-crawlee-cheerio/)) - Standard and up to date template for developing with Crawlee's CheerioCrawler.
- [PlaywrightCrawler](./templates/js-crawlee-playwright-chrome/) ([TypeScript version](./templates/ts-crawlee-playwright-chrome/)) - Standard and up to date template for developing with Crawlee's PlaywrightCrawler.
- [PuppeteerCrawler](./templates/js-crawlee-puppeteer-chrome/) ([TypeScript version](./templates/ts-crawlee-puppeteer-chrome/)) - Standard and up to date template for developing with Crawlee's PuppeteerCrawler.

To run the template:

```Bash
cd my-actor
apify run
```

## Templates API

The [template manifest](./templates/manifest.json) can be fetched programmatically.
Apify CLI uses this to always fetch the most up to date templates.

```Bash
npm i @apify/actor-templates
```

```JavaScript
const templates = require("@apify/actor-templates");

const manifest = await templates.fetchManifest();
```

## Publish updated/new template

All templates are stores in `./templates` directory.
For each template needs to create an archive of whole source code into the `./dist/templates` directory.
The archive is used to create a boilerplate template in `apify CLI` or other places in the Apify system.

### Update and add templates

If you want to change a template, you will have to update the template files and the [`manifest.json`](./templates/manifest.json) file before pushing the changes to the `master` branch. After pushing to `master`, the archive will be automatically built using Github actions.

## How to propagate templates into Apify CLI

Templates are propagated to Apify CLI templates. You can then find your newly added template when using the `apify create` command.
The propagation happens after committing a new version of the template into the `master` branch. After tests succeeded the Github action
builds `archives` of each template and pushes these `archives` into the repository. The CLI command then uses those archives
to bootstrap your project folder. We did it this way because we can update template structure/code without publishing
any package to npm. It makes templates changes agile.

## Reference

- [Apify Actor documentation](https://docs.apify.com/actor)
- [Apify CLI](https://docs.apify.com/cli)
- [Apify SDK](https://sdk.apify.com/)

## Contributing

If you have any ideas for improvements, either submit an issue or create a pull request.
For contribution guidelines and the code of conduct, see [CONTRIBUTING.md](CONTRIBUTING.md).
