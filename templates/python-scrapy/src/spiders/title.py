from operator import call
from typing import Generator, Union
from urllib.parse import urljoin

from scrapy import Request, Spider
from scrapy.responsetypes import Response

from apify import Actor

from ..items import TitleItem


class TitleSpider(Spider):
    """
    Scrapes title pages and enqueues all links found on the page.
    """

    name = 'title_spider'
    start_urls = ['https://apify.com']

    def parse(self, response: Response) -> Generator[Union[TitleItem, Request], None, None]:
        """
        Parse the web page response.

        Args:
            response: The web page response.

        Yields:
            Yields scraped TitleItem and Requests for links.
        """
        Actor.log.info(f'TitleSpider is parsing {response}...')

        # Extract and yield the TitleItem
        url = response.url
        title = response.css('title::text').extract_first()
        yield TitleItem(url=url, title=title)

        # Extract all links from the page, create Requests out of them, and yield them
        for link_href in response.css('a::attr("href")'):
            link_url = urljoin(response.url, link_href.get())
            if link_url.startswith(('http://', 'https://')):
                yield Request(link_url, callback=self.foo)

    def foo(self, response: Response) -> Generator[Union[TitleItem, Request], None, None]:
        Actor.log.info(f'foo is parsing {response}...')
        url = response.url
        title = response.css('title::text').extract_first()
        yield TitleItem(url=url, title=f'foo: {title}')
