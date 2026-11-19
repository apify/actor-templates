# Actor CLI starter template

<!-- This is an Apify template readme -->

Start a new Actorization project quickly and easily with this project template. It provides a basic structure for building an Actor with the [Apify CLI](https://docs.apify.com/cli) and allows you to easily add your own functionality.

## Included features

- **[Apify CLI](https://docs.apify.com/cli/)** - toolkit for building [Actors](https://apify.com/actors) that interact with the [Apify platform](https://docs.apify.com/platform/).
- **[jq](https://jqlang.org/)** - a command line filter for working with JSON
- **[mise](https://mise.jdx.dev)** - installs the command-line tools your Actor wraps

## How it works

This template is useful when you're already familiar with the [Apify Platform](https://docs.apify.com/platform/) and want to use the [Apify CLI](https://docs.apify.com/cli) to turn almost any project into an Actor.

### Adding command-line tools

List the tools you need in `mise.toml` and they get installed into the Docker image. Most tools from GitHub releases work out of the box:

```toml
[tools]
"github:BurntSushi/ripgrep" = "15.1.0"
```

Or run `mise use github:BurntSushi/ripgrep@15.1.0` if you have mise installed locally. mise verifies release checksums and GitHub artifact attestations where the project publishes them. Pin exact versions and let [Renovate](https://docs.renovatebot.com/modules/manager/mise/) keep them, and the mise image in the `Dockerfile`, up to date.

## Resources

- [Actor development](https://docs.apify.com/platform/actors/development) in Apify documentation - see especially the [actor.json](https://docs.apify.com/platform/actors/development/actor-definition/actor-json) part
- [Actor whitepaper](https://whitepaper.actor) for a deep dive into the Actor computing model
