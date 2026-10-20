// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
// Apify SDK - toolkit for building Apify Actors (Read more at https://github.com/apify/apify-sdk-rs)
use apify::crawlee::HtmlCrawler;
use apify::{Actor, ActorInputErrorCode, ExitOptions, InitOptions, ProxyConfigurationOptions};
use serde::Deserialize;
use tracing_subscriber::EnvFilter;

mod routes;

// Structure of input is defined in input_schema.json
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Input {
    start_urls: Vec<StartUrl>,
    max_requests_per_crawl: u64,
}

#[derive(Debug, Deserialize)]
struct StartUrl {
    url: String,
}

impl Default for Input {
    fn default() -> Self {
        Self {
            start_urls: vec![StartUrl {
                url: "https://apify.com".to_owned(),
            }],
            max_requests_per_crawl: 100,
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Log level comes from the RUST_LOG environment variable, `info` by default.
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    // The init() call configures the Actor to correctly work with the Apify-provided environment - mainly the storage infrastructure. It is necessary that every Actor performs an init() call.
    Actor::init(InitOptions::default()).await?;

    // Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
    match run().await {
        Ok(()) => Actor::exit(ExitOptions::default()).await,
        Err(err) => {
            tracing::error!("{err:?}");
            Actor::fail(ExitOptions::default()).await;
        }
    }
    Ok(())
}

async fn run() -> anyhow::Result<()> {
    let input = match Actor::get_input::<Input>().await {
        Ok(input) => input,
        Err(err) if err.code == ActorInputErrorCode::NotFound => Input::default(),
        Err(err) => return Err(err.into()),
    };

    // `check_access` ensures the proxy credentials are valid, but the check can take a few hundred milliseconds.
    // Disable it for short runs if you are sure your proxy configuration is correct
    let proxy_configuration = Actor::create_proxy_configuration(ProxyConfigurationOptions {
        check_access: Some(true),
        ..Default::default()
    })
    .await?;

    let mut crawler = HtmlCrawler::builder()
        .services(Actor::services().clone())
        .max_requests_per_crawl(input.max_requests_per_crawl)
        .router(routes::router());
    if let Some(proxy_configuration) = proxy_configuration {
        crawler = crawler.proxy_configuration(proxy_configuration);
    }
    let crawler = crawler.build()?;

    crawler
        .run(input.start_urls.into_iter().map(|start_url| start_url.url))
        .await?;
    Ok(())
}
