import scrapy

class QuotesSpider(scrapy.Spider):
    name = 'quotes'

    def __init__(self, tag=None, *args, **kwargs):
        super().__init__(*args, **kwargs)

        tag_suffix = ''
        if tag is not None:
            tag_suffix = f'tag/{tag}/'

        self.start_urls = [f'https://quotes.toscrape.com/{tag_suffix}']

    def parse(self, response):
        for quote in response.css('div.quote'):
            yield {
                'author': quote.css('small.author::text').extract_first(),
                'text': quote.css('span.text::text').extract_first(),
                'tags': quote.css('div.tags > a.tag::text').extract()
            }

        next_page = response.css('li.next a::attr("href")').get()
        if next_page is not None:
            yield response.follow(next_page, self.parse)
