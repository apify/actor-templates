"""
This module transforms a Scrapy project into an Apify Actor, handling the configuration of logging, patching Scrapy's
logging system, and establishing the required environment to run the Scrapy spider within the Apify platform.

This file is specifically designed to be executed when the project is run as an Apify Actor using `apify run` locally
or being run on the Apify platform. It is not being executed when running the project as a Scrapy project using
`scrapy crawl title_spider`.

We recommend you do not modify this file unless you really know what you are doing.
"""

# We need to configure the logging first before we import anything else, so that nothing else imports
# `scrapy.utils.log` before we patch it.
import logging
from typing import Any
from scrapy.utils import log as scrapy_logging
from scrapy.utils.project import get_project_settings
from apify.log import ActorLogFormatter

# To change the logging level, modify the `LOG_LEVEL` field in `settings.py`. If the field is not present in the file,
# Scrapy will default to `DEBUG`. This setting applies to all loggers. If you wish to change the logging level for
# a specific logger, do it in this file.
settings = get_project_settings()
LOGGING_LEVEL = settings['LOG_LEVEL']

handler = logging.StreamHandler()
handler.setFormatter(ActorLogFormatter(include_logger_name=True))

apify_logger = logging.getLogger('apify')
apify_logger.setLevel(LOGGING_LEVEL)
apify_logger.addHandler(handler)

apify_client_logger = logging.getLogger('apify_client')
apify_client_logger.setLevel(LOGGING_LEVEL)
apify_client_logger.addHandler(handler)

# We can't attach our log handler to the loggers normally, because Scrapy would remove them in the `configure_logging`
# call here: https://github.com/scrapy/scrapy/blob/2.11.0/scrapy/utils/log.py#L113 (even though
# `disable_existing_loggers` is set to False :facepalm:). We need to monkeypatch Scrapy's `configure_logging` method
# like this, so that our handler is attached right after Scrapy calls the `configure_logging` method, because
# otherwise we would lose some log messages.
old_configure_logging = scrapy_logging.configure_logging

def new_configure_logging(*args: Any, **kwargs: Any) -> None:
    """
    We need to manually configure both the root logger and all Scrapy-associated loggers. Configuring only the root
    logger is not sufficient, as Scrapy will override it with its own settings. Scrapy uses these four primary
    loggers - https://github.com/scrapy/scrapy/blob/2.11.0/scrapy/utils/log.py#L60:L77. Therefore, we configure here
    these four loggers and the root logger.
    """
    old_configure_logging(*args, **kwargs)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(LOGGING_LEVEL)

    scrapy_logger = logging.getLogger('scrapy')
    scrapy_logger.addHandler(handler)
    scrapy_logger.setLevel(LOGGING_LEVEL)

    twisted_logger = logging.getLogger('twisted')
    twisted_logger.addHandler(handler)
    twisted_logger.setLevel(LOGGING_LEVEL)

    filelock_logger = logging.getLogger('filelock')
    filelock_logger.addHandler(handler)
    filelock_logger.setLevel(LOGGING_LEVEL)

    hpack_logger = logging.getLogger('hpack')
    hpack_logger.addHandler(handler)
    hpack_logger.setLevel(LOGGING_LEVEL)

    # Set the HTTPX logger explicitly to the WARNING level, because it is too verbose and spams the logs with useless
    # messages, especially when running on the platform
    httpx_logger = logging.getLogger('httpx')
    httpx_logger.addHandler(handler)
    httpx_logger.setLevel(logging.WARNING)

scrapy_logging.configure_logging = new_configure_logging

# Now we can do the rest of the setup
import asyncio
import os
import nest_asyncio
from scrapy.utils.reactor import install_reactor
from .main import main

# To ensure seamless compatibility between asynchronous libraries Twisted (used by Scrapy) and AsyncIO (used by Apify),
# it is highly recommended to use AsyncioSelectorReactor as the Twisted reactor
install_reactor('twisted.internet.asyncioreactor.AsyncioSelectorReactor')
nest_asyncio.apply()

# Specify the path to the Scrapy project settings module
os.environ['SCRAPY_SETTINGS_MODULE'] = 'src.settings'

# Run the Apify main coroutine
asyncio.run(main())
