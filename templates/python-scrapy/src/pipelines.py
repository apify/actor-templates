# Define your item pipelines here
#
# See the Scrapy documentation: http://doc.scrapy.org/en/latest/topics/item-pipeline.html

import scrapy

from .items import TitleItem


class TitleItemPipeline:

    def process_item(self, item: TitleItem, spider: scrapy.Spider) -> TitleItem:
        # Do something with the item here, such as cleaning it or persisting it to a database
        return item
