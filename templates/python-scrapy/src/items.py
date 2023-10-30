# Define the models for your scraped items here
#
# See the Scrapy documentation: http://doc.scrapy.org/en/latest/topics/items.html

from scrapy import Field, Item


class TitleItem(Item):
    """
    Represents a title item scraped from a web page.
    """

    url = Field()
    title = Field()


class ProductItem(Item):
    """
    Represents a product item scraped from a web page.
    """

    url = Field()
    product_name = Field()
