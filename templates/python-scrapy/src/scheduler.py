import traceback
import apify_shared

from scrapy import Spider
from scrapy.core.scheduler import BaseScheduler
from scrapy.http.request import Request
from scrapy.utils.reactor import is_asyncio_reactor_installed

from apify import Actor
from apify.storages import RequestQueue

from .utils import (
    get_running_event_loop_id,
    nested_event_loop,
    open_queue_with_custom_client,
    to_apify_request,
    to_scrapy_request,
)


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
        Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyScheduler is initializing...')
        self._rq: RequestQueue | None = None
        self.spider: Spider | None = None

    def open(self, spider: Spider) -> None:
        """
        Open the scheduler.

        Args:
            spider: The spider that the scheduler is associated with.
        """
        Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyScheduler is opening...')
        self.spider = spider

        try:
            self._rq = nested_event_loop.run_until_complete(open_queue_with_custom_client())
        except BaseException:
            traceback.print_exc()

    def close(self, reason: str) -> None:
        """
        Close the scheduler.

        Args:
            reason: The reason for closing the scheduler.
        """
        Actor.log.debug(f'Apify Scheduler is closing, reason: {reason}...')
        nested_event_loop.stop()
        nested_event_loop.close()

    def has_pending_requests(self) -> bool:
        """
        Check if the scheduler has any pending requests.

        Returns:
            True if the scheduler has any pending requests, False otherwise.
        """
        Actor.log.debug('ApifyScheduler has_pending_requests is called...')

        try:
            result = nested_event_loop.run_until_complete(self._rq.is_finished())
        except BaseException:
            traceback.print_exc()

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
        apify_request = to_apify_request(request)

        try:
            result = nested_event_loop.run_until_complete(self._rq.add_request(apify_request))
        except BaseException:
            traceback.print_exc()

        return bool(result['wasAlreadyPresent'])

    def next_request(self) -> Request | None:
        """
        Fetch the next request from the scheduler.

        Returns:
            The next request, or None if there are no more requests.
        """
        Actor.log.debug('ApifyScheduler is returning a next request...')

        try:
            apify_request = nested_event_loop.run_until_complete(self._rq.fetch_next_request())
        except BaseException:
            traceback.print_exc()

        Actor.log.debug(f'ApifyScheduler: apify_request={apify_request}')

        if apify_request is None:
            return None

        return to_scrapy_request(apify_request)
