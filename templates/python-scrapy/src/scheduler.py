import asyncio

from scrapy import Spider
from scrapy.core.scheduler import BaseScheduler
from scrapy.http.request import Request
from scrapy.utils.reactor import is_asyncio_reactor_installed

from apify import Actor
from apify.storages import RequestQueue

from .event_loop_manager import get_running_event_loop_id


class ApifyScheduler(BaseScheduler):
    """
    A Scrapy scheduler that uses the Apify Request Queue to manage requests.

    This scheduler requires the asyncio Twisted reactor to be installed.
    """

    def __init__(self) -> None:
        if not is_asyncio_reactor_installed():
            raise ValueError(
                f'{ApifyScheduler.__qualname__} requires the asyncio Twisted reactor. '
                'Make sure you have it configured in the TWISTED_REACTOR setting. See the asyncio '
                'documentation of Scrapy for more information.'
            )
        Actor.log.debug('ApifyScheduler is initializing...')
        self._event_loop: asyncio.AbstractEventLoop = asyncio.new_event_loop()
        self.rq: RequestQueue | None = None
        self.spider: Spider | None = None

    def open(self, spider: Spider) -> None:
        """
        Open the scheduler.

        Args:
            spider: The spider that the scheduler is associated with.
        """
        Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyScheduler is opening...')
        self.spider = spider

        # TODO: add support for custom client to Actor.open_request_queue(),
        # so that we don't have to do this hacky workaround
        async def open_queue_with_custom_client():
            Actor.log.debug(f'[{get_running_event_loop_id()}] open_queue_with_custom_client is called...')
            # Create a new Apify Client with its httpx client in the custom event loop
            custom_loop_apify_client = Actor.new_client()

            # Set the new Apify Client as the default client, back up the old client
            old_client = Actor.apify_client
            from apify.storages.storage_client_manager import StorageClientManager
            StorageClientManager.set_cloud_client(custom_loop_apify_client)

            # Create a new Request Queue in the custom event loop,
            # replace its Apify client with the custom loop's Apify client
            self.rq = await Actor.open_request_queue()

            if Actor.config.is_at_home:
                self.rq._request_queue_client = custom_loop_apify_client.rq(
                    self.rq._id, client_key=self.rq._client_key,
                )

            # Restore the old Apify Client as the default client
            StorageClientManager.set_cloud_client(old_client)

        self._event_loop.run_until_complete(open_queue_with_custom_client())

    def close(self, reason: str) -> None:
        """
        Close the scheduler.

        Args:
            reason: The reason for closing the scheduler.
        """
        Actor.log.debug(f'Apify Scheduler is closing, reason: {reason}...')
        self._event_loop.stop()
        self._event_loop.close()

    def has_pending_requests(self) -> bool:
        """
        Check if the scheduler has any pending requests.

        Returns:
            True if the scheduler has any pending requests, False otherwise.
        """
        Actor.log.debug('ApifyScheduler has_pending_requests is called...')
        result = self._event_loop.run_until_complete(self.rq.is_finished())
        return result

    def enqueue_request(self, request: Request) -> bool:
        """
        Add a request to the scheduler.

        Args:
            request: The request to add to the scheduler.

        Returns:
            True if the request was successfully enqueued, False otherwise.
        """
        Actor.log.debug(f'ApifyScheduler is enqueing a {request}...')
        # TODO: Add support for other Scrapy Request properties
        result = self._event_loop.run_until_complete(
            self.rq.add_request(request={'url': request.url, 'userData': {'meta': request.meta}}),
        )
        return bool(result['wasAlreadyPresent'])

    def next_request(self) -> Request | None:
        """
        Fetch the next request from the scheduler.

        Returns:
            The next request, or None if there are no more requests.
        """
        Actor.log.debug('ApifyScheduler is returning a next request...')
        apify_request = self._event_loop.run_until_complete(self.rq.fetch_next_request())

        if apify_request is None:
            return None

        # TODO: Add support for other Scrapy Request properties
        request_url = apify_request['url']
        request_userdata = apify_request.get('userData')
        request_meta = None
        if request_userdata is not None:
            request_meta = request_userdata.get('meta')

        # Create Scrapy request and add Apify's custom headers
        scrapy_request = Request(
            request_url,
            meta=request_meta,
            headers={
                'x-apify-request-id': apify_request['id'],
                'x-apify-request-uniquekey': apify_request['uniqueKey'],
            },
        )

        return scrapy_request
