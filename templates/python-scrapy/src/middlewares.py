import asyncio
import traceback

from scrapy import Spider
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.http import Request, Response
from scrapy.utils.response import response_status_message

from apify import Actor
from apify.storages import RequestQueue

from .event_loop_management import get_running_event_loop_id, open_queue_with_custom_client


class ApifyRetryMiddleware(RetryMiddleware):
    """
    Basically the default Scrapy retry middleware enriched with Apify's Request Queue interaction.
    """

    def __init__(self, *args: list, **kwargs: dict) -> None:
        Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyRetryMiddleware initializing...')
        super().__init__(*args, **kwargs)
        self._event_loop: asyncio.AbstractEventLoop = asyncio.new_event_loop()
        try:
            self._rq: RequestQueue = self._event_loop.run_until_complete(open_queue_with_custom_client())
        except BaseException:
            traceback.print_exc()

    def __del__(self):
        Actor.log.debug('ApifyRetryMiddleware is being deleted...')
        self._event_loop.stop()
        self._event_loop.close()

    def process_response(self, request: Request, response: Response, spider: Spider) -> Request | Response:
        """
        Process the response and decide whether the request should be retried.

        Args:
            request: The request that was sent.
            response: The response that was received.
            spider: The Spider that sent the request.

        Returns:
            The response, or a new request if the request should be retried.
        """
        Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyRetryMiddleware is processing: {request}, {response}...')

        # Robots requests are bypassed directly, they don't go through a Scrapy Scheduler, and also through our
        # Request Queue. Check the scrapy.downloadermiddlewares.robotstxt.RobotsTxtMiddleware for details.
        if request.url.endswith('robots.txt'):
            return response

        try:
            returned = self._event_loop.run_until_complete(self._handle_retry_logic(request, response, spider))
        except BaseException:
            traceback.print_exc()

        return returned

    async def _handle_retry_logic(
        self,
        request: Request,
        response: Response,
        spider: Spider
    ) -> Request | Response:
        Actor.log.debug(f'[{get_running_event_loop_id()}] handle_retry_logic is called...')
        req_id = request.meta.get('apify_request_id')
        req_unique_key = request.meta.get('apify_request_unique_key')

        apify_request = {
            'url': request.url,
            'method': request.method,
            'id': req_id.decode('utf-8') if isinstance(req_id, bytes) else req_id,
            'uniqueKey': req_unique_key.decode('utf-8') if isinstance(req_unique_key, bytes) else req_unique_key,
            # 'retryCount': ..., # todo: where to get this from?
        }

        if request.meta.get("dont_retry", False):
            await self._rq.mark_request_as_handled(apify_request)
            return response

        if response.status in self.retry_http_codes:
            await self._rq.reclaim_request(apify_request)
            reason = response_status_message(response.status)
            return self._retry(request, reason, spider) or response

        await self._rq.mark_request_as_handled(apify_request)
        return response
