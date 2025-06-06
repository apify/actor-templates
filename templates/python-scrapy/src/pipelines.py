"""Scrapy item pipelines module.

Module defines Scrapy item pipelines for scraped data. Item pipelines are processing components
that handle the scraped items, typically used for cleaning, validating, and persisting data.

For detailed information on creating and utilizing item pipelines, refer to the official documentation:
http://doc.scrapy.org/en/latest/topics/item-pipeline.html
"""
# ruff: noqa: ARG002, D102

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scrapy import Spider

    from .items import TitleItem


class TitleItemPipeline:
    """Define processing steps for `TitleItem` objects scraped by spiders."""

    def process_item(self, item: TitleItem, spider: Spider) -> TitleItem:
        # Do something with the item here, such as cleaning it or persisting it to a database
        return item
