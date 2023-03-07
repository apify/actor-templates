from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from apify import Actor

from .pipelines import ActorDatasetPushPipeline
from .spiders.quotes_spider import QuotesSpider


async def main():
    async with Actor:
        actor_input = await Actor.get_input() or {}
        quotes_tag = actor_input.get('tag')
        if quotes_tag:
            Actor.log.info(f'Scraping quotes with tag {quotes_tag}...')
        else:
            Actor.log.info(f'Scraping all quotes...')

        settings = get_project_settings()
        settings['ITEM_PIPELINES'] = { ActorDatasetPushPipeline: 1 }

        process = CrawlerProcess(settings, install_root_handler=False)

        # If you want to run multiple spiders, call `process.crawl` for each of them here
        process.crawl(QuotesSpider, tag=quotes_tag)

        process.start()
