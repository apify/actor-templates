import asyncio
import codecs
import pickle
import random
import string

from scrapy import Request

from apify import Actor
from apify.storages import RequestQueue, StorageClientManager

nested_event_loop: asyncio.AbstractEventLoop = asyncio.new_event_loop()


def get_random_id(length: int = 6) -> str:
    """
    Generate a random ID from alphanumeric characters.

    It could be useful mainly for debugging purposes.

    Args:
        length: The lenght of the ID. Defaults to 6.

    Returns:
        generated random ID
    """
    characters = string.ascii_letters + string.digits
    random_id = ''.join(random.choice(characters) for _ in range(length))
    return random_id


def get_running_event_loop_id() -> int:
    """
    Get the ID of the currently running event loop.

    It could be useful mainly for debugging purposes.

    Returns:
        The ID of the event loop.
    """
    return id(asyncio.get_running_loop())


def to_apify_request(scrapy_request: Request) -> dict:
    """
    Convert a Scrapy request to an Apify request.

    Args:
        scrapy_request: The Scrapy request to be converted.

    Returns:
        The converted Apify request.
    """
    assert isinstance(scrapy_request, Request)

    call_id = get_random_id()
    Actor.log.debug(f'[{call_id}]: to_apify_request was called (scrapy_request={scrapy_request})...')

    apify_request = {
        'url': scrapy_request.url,
        'method': scrapy_request.method,
    }

    # Add 'id' to the apify_request
    if scrapy_request.meta.get('apify_request_id'):
        apify_request['id'] = scrapy_request.meta['apify_request_id']

    # Add 'uniqueKey' to the apify_request
    if scrapy_request.meta.get('apify_request_unique_key'):
        apify_request['uniqueKey'] = scrapy_request.meta['apify_request_unique_key']

    # Add encoded Scrapy Request object to the apify_request
    scrapy_request_encoded = codecs.encode(pickle.dumps(scrapy_request), 'base64').decode()
    apify_request['userData'] = {'scrapy_request': scrapy_request_encoded}

    Actor.log.debug(f'[{call_id}]: scrapy_request was converted to the apify_request={apify_request}')
    return apify_request


def to_scrapy_request(apify_request: dict) -> Request:
    """
    Convert an Apify request to a Scrapy request.

    Args:
        apify_request: The Apify request to be converted.

    Returns:
        The converted Scrapy request.
    """
    assert isinstance(apify_request, dict)
    assert 'url' in apify_request
    assert 'method' in apify_request
    assert 'id' in apify_request
    assert 'uniqueKey' in apify_request

    call_id = get_random_id()
    Actor.log.debug(f'[{call_id}]: to_scrapy_request was called (apify_request={apify_request})...')

    # If the apify_request comes from the Scrapy
    if 'userData' in apify_request and 'scrapy_request' in apify_request['userData']:
        Actor.log.debug(f'[{call_id}]: gonna restore the Scrapy Request from the apify_request')

        scrapy_request_encoded = apify_request['userData']['scrapy_request']
        assert isinstance(scrapy_request_encoded, str)

        scrapy_request = pickle.loads(codecs.decode(scrapy_request_encoded.encode(), 'base64'))
        assert isinstance(scrapy_request, Request)
        Actor.log.debug(f'[{call_id}]: scrapy_request was successfully decoded (scrapy_request={scrapy_request})...')

        # Update the meta field with the meta field from the apify_request
        meta = scrapy_request.meta or {}
        meta.update({'apify_request_id': apify_request['id'], 'apify_request_unique_key': apify_request['uniqueKey']})
        scrapy_request._meta = meta  # scrapy_request.meta is a property, so we have to set it like this

    # If the apify_request comes directly from the Request Queue, typically start URLs
    else:
        Actor.log.debug(f'[{call_id}]: gonna create a new Scrapy Request (cannot be restored)')

        scrapy_request = Request(
            url=apify_request['url'],
            method=apify_request['method'],
            meta={
                'apify_request_id': apify_request['id'],
                'apify_request_unique_key': apify_request['uniqueKey'],
            },
        )

    Actor.log.debug(f'[{call_id}]: an apify_request was converted to the scrapy_request={scrapy_request}')
    return scrapy_request


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
