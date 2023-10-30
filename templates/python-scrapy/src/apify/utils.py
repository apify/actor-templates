import asyncio
from typing import Dict
import string
import random

from scrapy import Request

from apify import Actor
from apify.storages import RequestQueue, StorageClientManager

nested_event_loop: asyncio.AbstractEventLoop = asyncio.new_event_loop()

scrapy_requests_cache: Dict[str, Request] = {}


def get_random_id(length=6):
    characters = string.ascii_letters + string.digits
    random_id = ''.join(random.choice(characters) for _ in range(length))
    return random_id


def to_apify_request(scrapy_request: Request) -> dict:
    """
    Convert a Scrapy request to an Apify request.

    Args:
        scrapy_request: The Scrapy request to be converted.

    Returns:
        The converted Apify request.
    """
    call_id = get_random_id()
    Actor.log.debug(f'[{call_id}]: to_apify_request was called (scrapy_request={scrapy_request})...')
    Actor.log.debug(f'[{call_id}]: scrapy_requests_cache={scrapy_requests_cache}')

    # Store the scrapy_request to the cache
    Actor.log.debug(f'[{call_id}]: adding scrapy_request to the cache')
    scrapy_requests_cache[scrapy_request.url] = scrapy_request

    # Transform Scrapy Request into Apify request
    apify_request = {
        'url': scrapy_request.url,
        'method': scrapy_request.method,
        'userData': {
            'meta': scrapy_request.meta,
        },
    }

    if scrapy_request.meta.get('apify_request_id'):
        apify_request['id'] = scrapy_request.meta['apify_request_id']

    if scrapy_request.meta.get('apify_request_unique_key'):
        apify_request['uniqueKey'] = scrapy_request.meta['apify_request_unique_key']

    Actor.log.debug(f'[{call_id}]: scrapy_request was converted to the apify_request={apify_request}')
    Actor.log.debug(f'[{call_id}]: scrapy_requests_cache={scrapy_requests_cache}')
    return apify_request


def to_scrapy_request(apify_request: dict) -> Request:
    """
    Convert an Apify request to a Scrapy request.

    Args:
        apify_request: The Apify request to be converted.

    Returns:
        The converted Scrapy request.
    """
    call_id = get_random_id()
    Actor.log.debug(f'[{call_id}]: to_scrapy_request was called (apify_request={apify_request})...')
    Actor.log.debug(f'[{call_id}]: scrapy_requests_cache={scrapy_requests_cache}')

    url = apify_request['url']

    if url in scrapy_requests_cache:
        scrapy_request = scrapy_requests_cache[url]

        # Update the meta field with the meta field from the apify_request
        meta = scrapy_request.meta or {}
        meta.update({'apify_request_id': apify_request['id'], 'apify_request_unique_key': apify_request['uniqueKey']})
        scrapy_request._meta = meta  # scrapy_request.meta is a property, so we have to set it like this

        # Store the scrapy.Request to the cache
        scrapy_requests_cache[url] = scrapy_request

        Actor.log.debug(
            f'[{call_id}]: apify request url was found in the scrapy_requests_cache, taking scrapy request from it'
        )

    else:
        Actor.log.debug(
            f'[{call_id}]: apify request url was NOT found in the scrapy_requests_cache, creating a new scrapy request'
        )
        scrapy_request_dict = {
            'url': apify_request['url'],
            'meta': {
                'apify_request_id': apify_request['id'],
                'apify_request_unique_key': apify_request['uniqueKey'],
            },
        }

        # Add the method field to the scrapy_request if it is present in the apify_request
        if apify_request.get('method'):
            scrapy_request_dict['method'] = apify_request['method']

        # Update the meta field with the meta field from the apify_request
        apify_request_user_data = apify_request.get('userData', {})
        apify_request_meta = apify_request_user_data.get('meta', {})
        scrapy_request_dict['meta'].update(apify_request_meta)

        # Create the scrapy.Request object
        scrapy_request = Request(**scrapy_request_dict)

        # Store the scrapy.Request to the cache
        Actor.log.debug(f'[{call_id}]: adding scrapy_request to the cache')
        scrapy_requests_cache[scrapy_request.url] = scrapy_request

    Actor.log.debug(f'[{call_id}]: an apify_request was converted to the scrapy_request={scrapy_request}')
    Actor.log.debug(f'[{call_id}]: scrapy_requests_cache={scrapy_requests_cache}')
    return scrapy_request


def get_running_event_loop_id() -> int:
    """
    Get the ID of the currently running event loop.

    It could be useful mainly for debugging purposes.

    Returns:
        The ID of the event loop.
    """
    return id(asyncio.get_running_loop())


async def open_queue_with_custom_client() -> RequestQueue:
    """
    Open a Request Queue with custom Apify Client.

    TODO: add support for custom client to Actor.open_request_queue(), so that
    we don't have to do this hacky workaround
    """
    # Create a new Apify Client with its httpx client in the custom event loop
    custom_loop_apify_client = Actor.new_client()

    # Set the new Apify Client as the default client, back up the old client
    old_client = Actor.apify_client
    StorageClientManager.set_cloud_client(custom_loop_apify_client)

    # Create a new Request Queue in the custom event loop,
    # replace its Apify client with the custom loop's Apify client
    rq = await Actor.open_request_queue()

    if Actor.config.is_at_home:
        rq._request_queue_client = custom_loop_apify_client.request_queue(
            rq._id,
            client_key=rq._client_key,
        )

    # Restore the old Apify Client as the default client
    StorageClientManager.set_cloud_client(old_client)
    return rq
