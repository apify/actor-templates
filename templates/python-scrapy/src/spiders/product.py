from typing import Generator

from scrapy import Request, Spider
from scrapy.responsetypes import Response

from apify import Actor

from ..items import ProductItem


class ProductSpider(Spider):
    name = 'product_spider'
    start_urls = ['https://www.apc.fr/men/men-shirts.html']

    def parse(self, response: Response) -> Generator[Request, None, None]:
        Actor.log.debug(f'TitleSpider is parsing {response}...')
        li_elements = response.css('li.product-item')
        product_links = []

        for li in li_elements:
            productlink_container = li.css('.product-link')
            product_link = productlink_container.css('a::attr(href)').get()
            if product_link:
                product_links.append(product_link)

        for link in product_links:
            r = Request(url=link, callback=self.second_callback)
            Actor.log.debug(f'Yielding request with callback={r}...')
            yield r

    def second_callback(self, response: Response) -> ProductItem:
        Actor.log.debug(f'Second callback is parsing {response}...')
        product_name = response.css('h1.product-name::text').get()
        Actor.log.debug(f'product_name={product_name}')
        return ProductItem(url=response.url, product_name=product_name)
