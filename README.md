<img src="actor-logo.png" align="right" />

# Apify Actor templates
> This repository stores boilerplate templates and code examples for [Apify Actor](https://apify.com/actors).
  The template helps you to get started with your Apify project quickly.

## How to use the templates

You can start using them right away in Apify command-line interface:

```
npm -g install apify-cli
apify create my-actor
```

It displays an interactive list of templates for you to choose from.
See [Apify CLI documentation](https://docs.apify.com/cli) for more details.

To run the template:

```
cd my-actor
apify run
```

## Example templates
The example templates provide a quick and easy way to get to know Apify actors.
Just install the CLI and watch your actor run.

- [Hello world](./templates/example_hello_world) -The smallest actor you will see today, it only takes input and generates output.
- [Puppeteer single page](./templates/example_puppeteer_single_page) - Load a single web page using Chrome and Puppeteer and extract data from it.
- [Basic crawler](./templates/example_basic_crawler) - Crawl a list of URLs using raw HTTP requests and Cheerio HTML parser.

You can find more code examples in the [examples folder](./examples) and in the
[Apify SDK documentation](https://sdk.apify.com/docs/examples/puppeteer-crawler/).

## Project boilerplate
If you're already familiar with actors, you can use the following templates to bootstrap new projects quickly:

- [Empty project](./templates/project_empty) - Template with very little boilerplate code.
- [Cheerio crawler](./templates/project_cheerio_crawler) - Standard and up to date template for developing with CheerioCrawler.
- [Puppeteer crawler](./templates/project_puppeteer_crawler) - Standard and up to date template for developing with PuppeteerCrawler.

## Templates API

The [template manifest](./templates/manifest.json) can be fetched programmatically.
Apify CLI uses this to always fetch the most up to date templates.

```
npm i @apify/actor-templates
```

```js
const templates = require('@apify/actor-templates');

const manifest = await templates.fetchManifest(); 
```

## Publish updated/new template

All templates are stores in `./templates` directory.
For each template needs to create an archive of whole source code into `./dist/templates` directory.
The archive is used to to create a boilerplate template in apify CLI or other places in Apify system.

### Update and add templates

If you want to change template, you need to update the files and [`manifest.json`](./templates/manifest.json)
and then push to master. After pushing to master, the archive will be automatically built using Github actions.

## How to propagate templates into Apify CLI

Templates are propagated to Apify CLI templates, you can choose one of the templates when using the `apify create` command.
The propagation happens after committing a new version of templates into `master` branch. After tests succeeded the Github action
builds archives of each template and pushes these archives into the repository. The CLI command then uses those archives
to bootstrap your project folder. We did it this way because we can update template structure/code without publishing
any package to npm. It makes templates changes agile.

## Reference
- [Apify Actor documentation](https://docs.apify.com/actor)
- [Apify CLI](https://docs.apify.com/cli)
- [Apify SDK](https://sdk.apify.com/)

## Contributing
If you have any ideas for improvements, either submit an issue or create a pull request.
For contribution guidelines and the code of conduct, see [CONTRIBUTING.md](CONTRIBUTING.md).
