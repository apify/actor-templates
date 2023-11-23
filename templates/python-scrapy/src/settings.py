"""
Scrapy settings module

This module contains Scrapy settings for the project, defining various configurations and options.

For more comprehensive details on Scrapy settings, refer to the official documentation:
http://doc.scrapy.org/en/latest/topics/settings.html
"""

# You can update these options and add new ones
BOT_NAME = 'titlebot'
DEPTH_LIMIT = 1  # This will be overridden by the `max_depth` option from Actor input if running using Apify
ITEM_PIPELINES = {'src.pipelines.TitleItemPipeline': 123}
LOG_LEVEL = 'INFO'
NEWSPIDER_MODULE = 'src.spiders'
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'
ROBOTSTXT_OBEY = True
SPIDER_MODULES = ['src.spiders']
