"""Module defines the FastAPI application that the Server Actor serves."""

from __future__ import annotations

from typing import Annotated, Any

from apify import Actor
from fastapi import FastAPI, Header, Query, Request
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel

# The event charged for each request. Define its price in .actor/pay_per_event.json.
CHARGED_EVENT = 'api-request'


class Greeting(BaseModel):
    """Response of the example endpoint."""

    message: str


async def charge_request(request_id: str | None) -> None:
    """Charge the user who sent the request for one event.

    The platform adds an `X-Actor-Request-ID` header to every request it forwards to a Server Actor. In a multi-tenant
    run, the ID tells the platform which user to charge. A single-tenant run ignores it, so the same code works
    for both tenancies. Requests you send to a local run have no ID, and locally `Actor.charge()` charges nothing.

    Call this before you return the response. After the request ends, its ID stops working.
    """
    if not request_id:
        await Actor.charge(CHARGED_EVENT)
        return

    await Actor.charge(
        CHARGED_EVENT,
        request_id=request_id,
        # The platform ignores a repeated charge with the same key, so a retry does not charge the user twice.
        idempotency_key=f'{request_id}:{CHARGED_EVENT}',
    )


def create_app(pool: str | None) -> FastAPI:
    """Create the application. FastAPI serves its OpenAPI spec at `/openapi.json` and Swagger UI at `/docs`."""
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

    # An example endpoint. Replace it with the work your Actor does for each request.
    @app.get('/greet', summary='Return a greeting. Charges one api-request event.')
    async def greet(
        name: Annotated[str, Query(description='Who to greet')] = 'World',
        x_actor_request_id: Annotated[str | None, Header(include_in_schema=False)] = None,
        # The ID of the Apify user who sent the request. In a multi-tenant run, it is the only way to tell users
        # apart, so use it to rate-limit requests or to keep each user's data separate.
        x_apify_user_id: Annotated[str | None, Header(include_in_schema=False)] = None,
    ) -> Greeting:
        Actor.log.info(f'Handling GET /greet (request ID: {x_actor_request_id}, user ID: {x_apify_user_id})')

        result = Greeting(message=f'Hello, {name}!')

        await charge_request(x_actor_request_id)

        return result

    return app
