## Getting started

For complete information [see this article](https://docs.apify.com/platform/actors/development#build-actor-at-apify-console). In short, you will:

1. Build the Actor
2. Run the Actor

## Pull the Actor for local development

In case you would like to move to development on your local machine for customizable developer experience, you can pull the existing Actor from Apify console using Apify CLI:

1. Install `apify-cli`

    **Using Homebrew**

    ```
    brew install apify/tap/apify-cli
    ```

    **Using NPM**

    ```
    npm -g install apify-cli
    ```

2. Pull the Actor by its unique `<TITLE>`. This command will copy the actor into the current directory on your local machine.

    ```
    apify pull <TITLE>
    ```

## Documentation reference

To learn more about Apify and Actors, take a look at the following resources:

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Apify SDK for Python documentation](https://docs.apify.com/sdk/python)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)