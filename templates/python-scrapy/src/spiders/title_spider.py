from urllib.parse import urljoin

import scrapy

# Scrapes titles pages and enqueues all links it finds on the page
class TitleSpider(scrapy.Spider):
    name = 'title_spider'

    def __init__(self, start_urls, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_urls = start_urls

    def parse(self, response):
        yield {
            'url': response.url,
            'title': response.css('title::text').extract_first(),
        }
        for link_href in response.css('a::attr("href")'):
            link_url = urljoin(response.url, link_href.get())
            if link_url.startswith(('http://', 'https://')):
                yield scrapy.Request(link_url)
