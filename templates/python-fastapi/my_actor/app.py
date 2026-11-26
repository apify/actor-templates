"""Module defines the FastAPI application that the Server Actor serves."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from apify import Actor
from fastapi import BackgroundTasks, FastAPI, Header, Query, Request
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel

if TYPE_CHECKING:
    from collections.abc import Callable

# The event charged for each request. Define its price in .actor/pay_per_event.json.
CHARGED_EVENT = 'api-request'

SPENDING_LIMIT_REACHED = 'The spending limit of this run is reached.'


class Greeting(BaseModel):
    """Response of the example endpoint."""

    message: str


class Error(BaseModel):
    """Response of a request that failed."""

    error: str


async def charge_request(request_id: str | None) -> tuple[int, bool]:
    """Charge the user who sent the request for one event.

    The platform adds an `X-Actor-Request-ID` header to every request it forwards to a Server Actor. In a multi-tenant
    run, the ID tells the platform which user to charge. A single-tenant run ignores it, so the same code works
    for both tenancies. Requests you send to a local run have no ID, and locally `Actor.charge()` charges nothing.

    Call this before you return the response. After the request ends, its ID stops working.

    Returns:
        How many events were charged, and whether the user's spending limit for the run is reached.
    """
    if not request_id:
        result = await Actor.charge(CHARGED_EVENT)
    else:
        result = await Actor.charge(
            CHARGED_EVENT,
            request_id=request_id,
            # The platform ignores a repeated charge with the same key, so a retry does not charge the user twice.
            idempotency_key=f'{request_id}:{CHARGED_EVENT}',
        )

    return result.charged_count, result.event_charge_limit_reached


def create_app(pool: str | None, finish_run: Callable[[], None]) -> FastAPI:
    """Create the application. FastAPI serves its OpenAPI spec at `/openapi.json` and Swagger UI at `/docs`.

    The application calls `finish_run` when the spending limit of a single-tenant run is reached.
    """
    app = FastAPI(
        title='FastAPI Server Actor',
        description='An example API served by an Apify Server Actor.',
        version='0.0.1',
    )

    def list_endpoints() -> list[dict[str, Any]]:
        """List the endpoints from the OpenAPI spec, so a program that knows only the Actor's URL can find them."""
        return [
            {
                'method': method.upper(),
                'path': path,
                'summary': operation.get('summary'),
                'parameters': [
                    {'name': param['name'], 'in': param['in'], 'required': param.get('required', False)}
                    for param in operation.get('parameters', [])
                ],
            }
            for path, operations in app.openapi()['paths'].items()
            for method, operation in operations.items()
        ]

    @app.get('/', summary='List the endpoints of this API')
    async def index(request: Request) -> Response:
        # The platform sends this request to check that the server is ready. Always answer it.
        # https://docs.apify.com/actors/development/programming-interface/server-actors#readiness-probe
        if 'x-apify-container-server-readiness-probe' in request.headers:
            return PlainTextResponse('ok')

        return JSONResponse(
            {
                'name': app.title,
                'pool': pool,
                'endpoints': list_endpoints(),
                'openapi': app.openapi_url,
            }
        )

    @app.exception_handler(Exception)
    async def handle_error(_request: Request, _error: Exception) -> JSONResponse:
        # An error that an endpoint does not handle ends here, including a failed charge.
        # The server logs the error with its traceback.
        return JSONResponse({'error': 'Internal server error'}, status_code=500)

    # An example endpoint. Replace it with the work your Actor does for each request.
    @app.get(
        '/greet',
        summary='Return a greeting. Charges one api-request event.',
        response_model=Greeting,
        responses={
            402: {'model': Error, 'description': 'The spending limit of the run is reached, so nothing was charged'},
            500: {'model': Error, 'description': 'The request failed, for example because the charge failed'},
        },
    )
    async def greet(
        background_tasks: BackgroundTasks,
        name: Annotated[str, Query(description='Who to greet')] = 'World',
        x_actor_request_id: Annotated[str | None, Header(include_in_schema=False)] = None,
        # The ID of the Apify user who sent the request. In a multi-tenant run, it is the only way to tell users
        # apart, so use it to rate-limit requests or to keep each user's data separate.
        x_apify_user_id: Annotated[str | None, Header(include_in_schema=False)] = None,
    ) -> Greeting | JSONResponse:
        Actor.log.info(f'Handling GET /greet (request ID: {x_actor_request_id}, user ID: {x_apify_user_id})')

        result = Greeting(message=f'Hello, {name}!')

        charged_count, limit_reached = await charge_request(x_actor_request_id)

        # The user's spending limit for the run is reached. A single-tenant run belongs to that user, so finish it
        # once the response is sent. A multi-tenant run keeps serving other users.
        if limit_reached and pool == 'SINGLE_TENANT':
            background_tasks.add_task(finish_run)

        # Nothing was charged for this request, so do not return its result. A run without pay-per-event pricing
        # never reports that the limit is reached, so its requests always get the result.
        if limit_reached and charged_count == 0:
            return JSONResponse({'error': SPENDING_LIMIT_REACHED}, status_code=402)

        return result

    return app
