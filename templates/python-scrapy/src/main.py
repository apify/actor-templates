from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from apify import Actor

from .event_loop_manager import get_running_event_loop_id
from .pipelines import ActorDatasetPushPipeline
from .spiders.title_spider import TitleSpider


async def main():
    async with Actor:
        Actor.log.debug(f'[{get_running_event_loop_id()}] Actor main is being executed...')

        actor_input = await Actor.get_input() or {}
        max_depth = actor_input.get('max_depth', 1)
        start_urls = [start_url.get('url') for start_url in actor_input.get('start_urls', [{'url': 'https://apify.com'}])]

        settings = get_project_settings()
        settings['ITEM_PIPELINES'] = {ActorDatasetPushPipeline: 1}
        settings['SCHEDULER'] = 'src.scheduler.ApifyScheduler'
        settings['DOWNLOADER_MIDDLEWARES'] = {'src.middlewares.ApifyRetryMiddleware': 543}
        settings['DEPTH_LIMIT'] = max_depth

        # Add start URLs to the request queue
        rq = await Actor.open_request_queue()
        for url in start_urls:
            await rq.add_request({'url': url})

        # If you want to run multiple spiders, call `process.crawl` for each of them here
        process = CrawlerProcess(settings, install_root_handler=False)
        process.crawl(TitleSpider)
        process.start()
