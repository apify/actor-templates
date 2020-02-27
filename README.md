# Apify Actor templates

This repository stores boilerplate templates for Apify Actor.
The template helps you to get started with your Apify project quickly.

## Usage

You can start using them right away in Apify command-line client:

```
npm -g install apify-cli
apify create my-hello-world --template basic_crawler
```
It creates a boilerplate template in your current director with a basic_crawler template.
You can check Apify command-line client documentation for more details.

## Publish updated/new template

All templates are stores in `./templates` directory.
For each template needs to create an archive of whole source code into `./build` directory.
The archive is used to to create a boilerplate template in apify CLI or other places in Apify system.
Metadata same as URL of template archive is store in the [apify-shared package](https://github.com/apifytech/apify-shared-js/blob/master/src/consts.js#L479).

### Update

If you want to change template, you need to update their structure and them push it to master.
After committing to master, the archive will be automatically build using Github actions pipeline.

### New

If you want to create a new template, you need to add a new folder into `./templates`.
Then you need to do stuff as for updating template.
If you want to propagate this template to Apify system, you need to add template metadata to [apify-shared package](https://github.com/apifytech/apify-shared-js/blob/master/src/consts.js#L479).

## Reference
- [Apify Actor documentation](https://docs.apify.com/actor)
- [Apify CLI](https://docs.apify.com/cli)
- [Apify SDK](https://sdk.apify.com/)

## Contributing
If you have any ideas for improvements, either submit an issue or create a pull request.
For contribution guidelines and the code of conduct, see [CONTRIBUTING.md](CONTRIBUTING.md).
