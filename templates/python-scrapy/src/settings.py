# Scrapy settings for this project
#
# For simplicity, this file contains only settings considered important or commonly used.
#
# You can find more settings consulting the documentation: http://doc.scrapy.org/en/latest/topics/settings.html

# Do not change this since it would break the Scrapy <-> Apify interaction
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'

# The following settings can be updated by the user
BOT_NAME = 'titlebot'
SPIDER_MODULES = ['src.spiders']
NEWSPIDER_MODULE = 'src.spiders'
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'
ROBOTSTXT_OBEY = True  # obey robots.txt rules
ITEM_PIPELINES = {'src.pipelines.TitleItemPipeline': 123}
