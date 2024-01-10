"""
This module defines the main coroutine for the Apify Scrapy Actor, executed from the __main__.py file. The coroutine
processes the Actor's input and executes the Scrapy spider. Additionally, it configures Scrapy project settings by
adding Apify custom components, including a custom scheduler, retry middleware, and an item pipeline for pushing
data to the Apify dataset.

Customization:
--------------

Feel free to customize this file to add specific functionality to the Actor, such as incorporating your own Scrapy
components like spiders and handling Actor input. However, make sure you have a clear understanding of your
modifications. For instance, removing Apify-Scrapy components from the settings will break the integration
between Scrapy and Apify.

Documentation:
--------------

For an in-depth description of the Apify-Scrapy integration process, our Scrapy components, known limitations and
other stuff, please refer to the following documentation page: https://docs.apify.com/cli/docs/integrating-scrapy.
"""

from __future__ import annotations

from scrapy.crawler import CrawlerProcess
from scrapy.settings import Settings
from scrapy.utils.project import get_project_settings

from apify import Actor

# Import your Scrapy spider here
from .spiders.title import TitleSpider as Spider

# Default input values for local execution using `apify run`
LOCAL_DEFAULT_START_URLS = [{'url': 'https://apify.com'}]


def _get_scrapy_settings(proxy_cfg: dict | None = None) -> Settings:
    """
    Get Scrapy project settings with custom configurations.

    You can add your own Scrapy components either in this function or in your `settings.py`.

    Returns:
        Scrapy project settings with custom configurations.
    """
    settings = get_project_settings()

    # Use ApifyScheduler as the scheduler
    settings['SCHEDULER'] = 'apify.scrapy.scheduler.ApifyScheduler'

    # Add the ActorDatasetPushPipeline into the item pipelines, assigning it the highest integer (1000),
    # ensuring it is executed as the final step in the pipeline sequence
    settings['ITEM_PIPELINES']['apify.scrapy.pipelines.ActorDatasetPushPipeline'] = 1000

    # Disable the default RobotsTxtMiddleware, Apify's custom scheduler already handles robots.txt
    settings['DOWNLOADER_MIDDLEWARES']['scrapy.downloadermiddlewares.robotstxt.RobotsTxtMiddleware'] = None

    # Disable the default HttpProxyMiddleware and add ApifyHttpProxyMiddleware
    settings['DOWNLOADER_MIDDLEWARES']['scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware'] = None
    settings['DOWNLOADER_MIDDLEWARES']['apify.scrapy.middlewares.ApifyHttpProxyMiddleware'] = 950

    # Disable the default RetryMiddleware and add ApifyRetryMiddleware with the highest integer (1000)
    settings['DOWNLOADER_MIDDLEWARES']['scrapy.downloadermiddlewares.retry.RetryMiddleware'] = None
    settings['DOWNLOADER_MIDDLEWARES']['apify.scrapy.middlewares.ApifyRetryMiddleware'] = 1000

    # Store the proxy configuration
    settings['APIFY_PROXY_SETTINGS'] = proxy_cfg

    return settings


async def main() -> None:
    """
    Apify Actor main coroutine for executing the Scrapy spider.
    """
    async with Actor:
        Actor.log.info('Actor is being executed...')

        # Process Actor input
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('startUrls', LOCAL_DEFAULT_START_URLS)
        proxy_configuration = actor_input.get('proxyConfiguration')

        # Add start URLs to the request queue
        rq = await Actor.open_request_queue()
        for start_url in start_urls:
            url = start_url.get('url')
            await rq.add_request(request={'url': url, 'method': 'GET'})

        # Get Scrapy project settings with custom configurations
        settings = _get_scrapy_settings(proxy_configuration)

        # Execute the spider using Scrapy CrawlerProcess
        process = CrawlerProcess(settings, install_root_handler=False)
        process.crawl(Spider)
        process.start()
