import asyncio
import logging

from apify.log import ActorLogFormatter

from .main import main

# Set up logging of messages from the Apify SDK
handler = logging.StreamHandler()
handler.setFormatter(ActorLogFormatter())

apify_client_logger = logging.getLogger('apify_client')
apify_client_logger.setLevel(logging.INFO)
apify_client_logger.addHandler(handler)

apify_logger = logging.getLogger('apify')
apify_logger.setLevel(logging.DEBUG)
apify_logger.addHandler(handler)

asyncio.run(main())
