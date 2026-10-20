use apify::crawlee::{EnqueueLinksOptions, HtmlContext, Router};
use serde_json::json;

pub fn router() -> Router<HtmlContext> {
    let mut router = Router::new();

    router.add_default_handler(|ctx: HtmlContext| async move {
        tracing::info!("enqueueing new URLs");
        ctx.enqueue_links(EnqueueLinksOptions::new()).await?;

        // Extract title from the page.
        let title = ctx
            .with_html(|document| document.title().unwrap_or_default())
            .await?;
        tracing::info!(url = %ctx.url(), "{title}");

        // Save url and title to Dataset - a table-like storage.
        ctx.push_data(&json!({ "url": ctx.url().as_str(), "title": title }))?;
        Ok(())
    });

    router
}

#[cfg(test)]
mod tests {
    use apify::crawlee::{HtmlCrawler, Services};

    use super::router;

    #[tokio::test]
    async fn crawls_a_page_and_extracts_data_to_dataset() -> anyhow::Result<()> {
        let crawler = HtmlCrawler::builder()
            // A fresh in-memory storage, so that the test starts from empty storages.
            .services(Services::in_memory())
            .max_requests_per_crawl(10)
            .router(router())
            .build()?;

        let stats = crawler.run(["https://www.example.com"]).await?;
        assert!(stats.requests_succeeded >= 1);

        let items: Vec<serde_json::Value> = crawler.dataset().await?.get_all().await?;
        assert!(!items.is_empty());
        assert!(
            items[0]["url"]
                .as_str()
                .unwrap_or_default()
                .contains("example.com")
        );
        assert!(
            items[0]["title"]
                .as_str()
                .unwrap_or_default()
                .contains("Example Domain")
        );
        Ok(())
    }
}
