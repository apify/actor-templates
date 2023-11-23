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

Known limitations to be aware of:
---------------------------------

1. Asynchronous spiders and Twisted & AsyncIO integration

   Asynchronous spiders (and possibly other components) may encounter challenges due to the Twisted & AsyncIO
   integration. If you need to execute a coroutine within the Spider, it's recommended to use Apify's custom
   nested event loop. See the code example below or find inspiration from Apify's Scrapy components, such as
   [ApifyScheduler](https://github.com/apify/apify-sdk-python/blob/v1.3.0/src/apify/scrapy/scheduler.py#L109).

   ```
   from apify.scrapy.utils import nested_event_loop

   nested_event_loop.run_until_complete(my_coroutine())
   ```

2. Single spider limitation

   The current implementation supports the execution of only one Spider per project.
   Issue: https://github.com/apify/actor-templates/issues/202

3. 2nd level spider parse function

   Requests yielded from the 2nd level Spider parse function are currently not being processed.
   Issue: https://github.com/apify/actor-templates/issues/224
"""

from scrapy.crawler import CrawlerProcess
from scrapy.settings import Settings
from scrapy.utils.project import get_project_settings

from apify import Actor

# Import your Scrapy spider here
from {{spider_module_name}} import {{spider_class_name}} as Spider

# Default input values for local execution using `apify run`
LOCAL_DEFAULT_MAX_DEPTH = 1
LOCAL_DEFAULT_START_URLS = [{'url': 'https://apify.com'}]


def _get_scrapy_settings(max_depth: int) -> Settings:
    """
    Get Scrapy project settings with custom configurations.

    You can add your own Scrapy components either in this function or in your `settings.py`.

    Args:
        max_depth: Maximum depth for spider crawling.

    Returns:
        Scrapy project settings with custom configurations.
    """
    settings = get_project_settings()
    # Add Apify Actor dataset push pipeline with the lowest priority
    settings['ITEM_PIPELINES']['apify.scrapy.pipelines.ActorDatasetPushPipeline'] = 1
    # Disable default retry middleware
    settings['DOWNLOADER_MIDDLEWARES']['scrapy.downloadermiddlewares.retry.RetryMiddleware'] = None
    # Add Apify custom retry middleware with the top priority
    settings['DOWNLOADER_MIDDLEWARES']['apify.scrapy.middlewares.ApifyRetryMiddleware'] = 999
    # Add Apify custom scheduler
    settings['SCHEDULER'] = 'apify.scrapy.scheduler.ApifyScheduler'
    # Set the maximum depth for spider crawling
    settings['DEPTH_LIMIT'] = max_depth
    return settings


async def main() -> None:
    """
    Apify Actor main coroutine for executing the Scrapy spider.
    """
    async with Actor:
        Actor.log.info('Actor is being executed...')

        # Process Actor input - here you can add your own logic for handling Actor input
        actor_input = await Actor.get_input() or {}
        max_depth = actor_input.get('max_depth', LOCAL_DEFAULT_MAX_DEPTH)
        start_urls = [start_url.get('url') for start_url in actor_input.get('start_urls', LOCAL_DEFAULT_START_URLS)]

        # Get Scrapy project settings with custom configurations
        settings = _get_scrapy_settings(max_depth)

        # Add start URLs to the request queue
        rq = await Actor.open_request_queue()
        for url in start_urls:
            await rq.add_request({'url': url, 'method': 'GET'})

        # Execute the spider using Scrapy CrawlerProcess
        process = CrawlerProcess(settings, install_root_handler=False)
        process.crawl(Spider)
        process.start()
