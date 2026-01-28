"""Scrapy item models module.

Module defines Scrapy item models for scraped data. Items represent structured data
extracted by spiders.

For detailed information on creating and utilizing items, refer to the official documentation:
https://docs.scrapy.org/en/latest/topics/items.html
"""

from __future__ import annotations

from scrapy import Field, Item


class TitleItem(Item):
    """Represents a title item scraped from a web page."""

    url = Field()
    title = Field()
