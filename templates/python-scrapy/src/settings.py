"""Scrapy settings module.

This module contains Scrapy settings for the project, defining various configurations and options.

For more comprehensive details on Scrapy settings, refer to the official documentation:
http://doc.scrapy.org/en/latest/topics/settings.html
"""

BOT_NAME = 'titlebot'
DEPTH_LIMIT = 1
LOG_LEVEL = 'INFO'
NEWSPIDER_MODULE = 'src.spiders'
ROBOTSTXT_OBEY = True
SPIDER_MODULES = ['src.spiders']
TELNETCONSOLE_ENABLED = False
# Do not change the Twisted reactor unless you really know what you are doing.
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 7200
ITEM_PIPELINES = {
    'src.pipelines.TitleItemPipeline': 123,
}
SPIDER_MIDDLEWARES = {
    'src.middlewares.TitleSpiderMiddleware': 543,
}
DOWNLOADER_MIDDLEWARES = {
    'src.middlewares.TitleDownloaderMiddleware': 543,
}
