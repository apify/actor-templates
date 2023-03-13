from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from apify import Actor

from .pipelines import ActorDatasetPushPipeline
from .spiders.title_spider import TitleSpider


async def main():
    async with Actor:
        actor_input = await Actor.get_input() or {}
        max_depth = actor_input.get('max_depth', 1)
        start_urls = [start_url.get('url') for start_url in actor_input.get('start_urls', [{ 'url': 'https://apify.com' }])]

        settings = get_project_settings()
        settings['ITEM_PIPELINES'] = { ActorDatasetPushPipeline: 1 }
        settings['DEPTH_LIMIT'] = max_depth

        process = CrawlerProcess(settings, install_root_handler=False)

        # If you want to run multiple spiders, call `process.crawl` for each of them here
        process.crawl(TitleSpider, start_urls=start_urls)

        process.start()
