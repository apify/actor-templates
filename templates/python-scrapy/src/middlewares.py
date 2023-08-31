from scrapy import Spider
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.http import Request, Response
from scrapy.utils.response import response_status_message

from apify import Actor

from .event_loop_manager import EventLoopManager, get_running_event_loop_id


class ApifyRetryMiddleware(RetryMiddleware):
    """
    Basically the default Scrapy retry middleware enriched with Apify's Request Queue interaction.
    """

    def __init__(self, *args: list, **kwargs: dict) -> None:
        Actor.log.debug('ApifyMiddleware initializing...')
        super().__init__(*args, **kwargs)

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
        Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyMiddleware is processing: {request}, {response}...')

        apify_request = {
            'id': request.headers.get('x-apify-request-id'),
            'uniqueKey': request.headers.get('x-apify-request-uniquekey'),
        }

        async def handle_retry_logic():
            Actor.log.debug(f'[{get_running_event_loop_id()}] ApifyMiddleware.handle_retry_logic is called...')
            rq = await Actor.open_request_queue()

            if request.meta.get("dont_retry", False):
                rq.mark_request_as_handled(apify_request)
                return response

            if response.status in self.retry_http_codes:
                rq.reclaim_request(apify_request)
                reason = response_status_message(response.status)
                return self._retry(request, reason, spider) or response

            rq.mark_request_as_handled(apify_request)
            return response

        with EventLoopManager() as nested_event_loop:
            return nested_event_loop.run_until_complete(handle_retry_logic())
