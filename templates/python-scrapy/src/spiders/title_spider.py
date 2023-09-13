from typing import Generator
from urllib.parse import urljoin

import scrapy
from scrapy.responsetypes import Response

from apify import Actor


class TitleSpider(scrapy.Spider):
    """
    Scrapes titles pages and enqueues all links it finds on the page.
    """

    name = 'title_spider'

    def parse(self, response: Response) -> Generator[dict, None, None]:
        Actor.log.info(f'TitleSpider is parsing {response}...')

        yield {
            'url': response.url,
            'title': response.css('title::text').extract_first(),
        }
        for link_href in response.css('a::attr("href")'):
            link_url = urljoin(response.url, link_href.get())
            if link_url.startswith(('http://', 'https://')):
                yield scrapy.Request(link_url)
