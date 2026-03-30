"""Scrapy settings module.

This module contains Scrapy settings for the project, defining various configurations and options.

For more comprehensive details on Scrapy settings, refer to the official documentation:
http://doc.scrapy.org/en/latest/topics/settings.html
"""

BOT_NAME = 'titlebot'
DEPTH_LIMIT = 1
LOG_LEVEL = 'INFO'
NEWSPIDER_MODULE = 'my_actor.spiders'
ROBOTSTXT_OBEY = True
SPIDER_MODULES = ['my_actor.spiders']
TELNETCONSOLE_ENABLED = False
# Do not change the Twisted reactor unless you really know what you are doing.
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 7200
ITEM_PIPELINES = {
    'my_actor.pipelines.TitleItemPipeline': 123,
}
SPIDER_MIDDLEWARES = {
    'my_actor.middlewares.TitleSpiderMiddleware': 543,
}
DOWNLOADER_MIDDLEWARES = {
    'my_actor.middlewares.TitleDownloaderMiddleware': 543,
}
