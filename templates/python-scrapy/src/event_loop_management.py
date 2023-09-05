import asyncio
from asyncio import AbstractEventLoop
from types import TracebackType
from apify import Actor
from apify.storages import RequestQueue, StorageClientManager


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
    Actor.log.debug(f'[{get_running_event_loop_id()}] open_queue_with_custom_client is called...')
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
            rq._id, client_key=rq._client_key,
        )

    # Restore the old Apify Client as the default client
    StorageClientManager.set_cloud_client(old_client)
    return rq
