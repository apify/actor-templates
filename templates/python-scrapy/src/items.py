# Define the models for your scraped items here
#
# See the Scrapy documentation: http://doc.scrapy.org/en/latest/topics/items.html

import scrapy


class TitleItem(scrapy.Item):
    # Define the fields for your item here
    url = scrapy.Field()
    title = scrapy.Field()
