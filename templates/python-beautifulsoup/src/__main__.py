"""
This module serves as the entry point for executing the Apify Actor. It handles the configuration of logging
settings. The `main()` coroutine is then executed using `asyncio.run()`.

Feel free to modify this file to suit your specific needs.
"""

import asyncio
import logging

from apify.log import ActorLogFormatter

from .main import main

# Configure loggers
handler = logging.StreamHandler()
handler.setFormatter(ActorLogFormatter())

apify_client_logger = logging.getLogger('apify_client')
apify_client_logger.setLevel(logging.INFO)
apify_client_logger.addHandler(handler)

apify_logger = logging.getLogger('apify')
apify_logger.setLevel(logging.DEBUG)
apify_logger.addHandler(handler)

# Execute the Actor main coroutine
asyncio.run(main())
