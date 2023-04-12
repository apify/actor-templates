# Start with JavaScript template

A simple JavaScript example of core Actor and Apify SDK features. It reads and validates user input with schema, computes a result and saves it to storage.

## Getting Started

### Install Apify CLI

#### Using Homebrew

```Bash
brew install apify/tap/apify-cli
```

#### Using NPM

```Bash
npm -g install apify-cli
```

### Create a new Actor using this template

```Bash
apify create my-javascript-actor -t getting_started_node
```

### Run the Actor locally

```Bash
cd my-javascript-actor
apify run
```

## Deploy on Apify

### Log in to Apify

You will need to provide your [Apify API Token](https://console.apify.com/account/integrations) to complete this action.

```Bash
apify login
```

### Deploy your Actor

This command will deploy and build the Actor on the Apify Platform. You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).

```Bash
apify push
```

## Documentation reference

To learn more about Apify and Actors, take a look at the following resources:

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)
