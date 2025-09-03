"""Create an MCP server that proxies requests through an MCP client.

This server is created independent of any transport mechanism.
Source: https://github.com/sparfenyuk/mcp-proxy

The server can optionally charge for MCP operations using a provided charging function.
This is typically used in Apify Actors to charge users for different types of MCP operations
like tool calls, prompt operations, or resource access.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from mcp import server, types

from .const import AUTHORIZED_TOOLS, ChargeEvents, get_charge_event

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from mcp.client.session import ClientSession

logger = logging.getLogger('apify')


async def charge_mcp_operation(
    charge_function: Callable[[str, int], Awaitable[Any]] | None, event_name: ChargeEvents | None, count: int = 1
) -> None:
    """Charge for an MCP operation.

    Args:
        charge_function: Function to call for charging, or None if charging is disabled
        event_name: The type of event to charge for
        count: The number of times the event occurred (typically 1, but can be more)
    """
    if not charge_function:
        return

    if not event_name:
        return

    try:
        await charge_function(event_name.value, count)
        logger.info(f'Charged for event: {event_name.value}')
    except Exception:
        logger.exception(f'Failed to charge for event {event_name.value}')
        # Don't raise the exception - we want the operation to continue even if charging fails


async def create_gateway(  # noqa: PLR0915
    client_session: ClientSession,
    actor_charge_function: Callable[[str, int], Awaitable[Any]] | None = None,
) -> server.Server[object]:
    """Create a server instance from a remote app.

    Args:
        client_session: The MCP client session to proxy requests through
        actor_charge_function: Optional function to charge for operations.
                       Should accept (event_name: str, params: Optional[dict]).
                       Typically, Actor.charge in Apify Actors.
                       If None, no charging will occur.
    """
    logger.debug('Sending initialization request to remote MCP server...')
    response = await client_session.initialize()
    capabilities: types.ServerCapabilities = response.capabilities

    logger.debug('Configuring proxied MCP server...')
    app: server.Server = server.Server(name=response.serverInfo.name, version=response.serverInfo.version)

    if capabilities.prompts:
        logger.debug('Capabilities: adding Prompts...')

        async def _list_prompts(_: Any) -> types.ServerResult:
            result = await client_session.list_prompts()
            return types.ServerResult(result)

        app.request_handlers[types.ListPromptsRequest] = _list_prompts

        async def _get_prompt(req: types.GetPromptRequest) -> types.ServerResult:
            # Uncomment the line below to charge for getting prompts
            # await charge_mcp_operation(actor_charge_function, ChargeEvents.PROMPT_GET) # noqa: ERA001
            result = await client_session.get_prompt(req.params.name, req.params.arguments)
            return types.ServerResult(result)

        app.request_handlers[types.GetPromptRequest] = _get_prompt

    if capabilities.resources:
        logger.debug('Capabilities: adding Resources...')

        async def _list_resources(_: Any) -> types.ServerResult:
            result = await client_session.list_resources()
            return types.ServerResult(result)

        app.request_handlers[types.ListResourcesRequest] = _list_resources

        async def _list_resource_templates(_: Any) -> types.ServerResult:
            result = await client_session.list_resource_templates()
            return types.ServerResult(result)

        app.request_handlers[types.ListResourceTemplatesRequest] = _list_resource_templates

        async def _read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
            # Uncomment the line below to charge for reading resources
            # await charge_mcp_operation(actor_charge_function, ChargeEvents.RESOURCE_READ)  # noqa: ERA001
            result = await client_session.read_resource(req.params.uri)
            return types.ServerResult(result)

        app.request_handlers[types.ReadResourceRequest] = _read_resource

    if capabilities.logging:
        logger.debug('Capabilities: adding Logging...')

        async def _set_logging_level(req: types.SetLevelRequest) -> types.ServerResult:
            await client_session.set_logging_level(req.params.level)
            return types.ServerResult(types.EmptyResult())

        app.request_handlers[types.SetLevelRequest] = _set_logging_level

    if capabilities.resources:
        logger.debug('Capabilities: adding Resources...')

        async def _subscribe_resource(req: types.SubscribeRequest) -> types.ServerResult:
            await client_session.subscribe_resource(req.params.uri)
            return types.ServerResult(types.EmptyResult())

        app.request_handlers[types.SubscribeRequest] = _subscribe_resource

        async def _unsubscribe_resource(req: types.UnsubscribeRequest) -> types.ServerResult:
            await client_session.unsubscribe_resource(req.params.uri)
            return types.ServerResult(types.EmptyResult())

        app.request_handlers[types.UnsubscribeRequest] = _unsubscribe_resource

    if capabilities.tools:
        logger.debug('Capabilities: adding Tools...')

        async def _list_tools(_: Any) -> types.ServerResult:
            tools = await client_session.list_tools()
            return types.ServerResult(tools)

        app.request_handlers[types.ListToolsRequest] = _list_tools

        async def _call_tool(req: types.CallToolRequest) -> types.ServerResult:
            tool_name = req.params.name
            arguments = req.params.arguments or {}

            # Safe diagnostic logging for every tool call
            logger.info(f"Received tool call, tool: '{tool_name}', arguments: {arguments}")

            if tool_name not in AUTHORIZED_TOOLS:
                # Block unauthorized tools
                error_message = f"The requested tool '{tool_name or 'unknown'}' is not authorized."
                error_message += f'Authorized tools are: {AUTHORIZED_TOOLS}'
                logger.error(f'Blocking unauthorized tool call for: {tool_name or "unknown tool"}')
                return types.ServerResult(
                    types.CallToolResult(content=[types.TextContent(type='text', text=error_message)], isError=True),
                )

            try:
                result = await client_session.call_tool(tool_name, arguments)
                logger.info(f'Tool executed successfully: {tool_name}')
                await charge_mcp_operation(actor_charge_function, get_charge_event(tool_name))
                return types.ServerResult(result)
            except Exception as e:
                # Log the full exception for debugging
                error_details = f"SERVER FAILED. Tool: '{tool_name}'. Arguments: {arguments}. Full exception: {e}"
                logger.exception(error_details)
                return types.ServerResult(
                    types.CallToolResult(content=[types.TextContent(type='text', text=error_details)], isError=True),
                )

        app.request_handlers[types.CallToolRequest] = _call_tool

    async def _send_progress_notification(req: types.ProgressNotification) -> None:
        await client_session.send_progress_notification(
            req.params.progressToken,
            req.params.progress,
            req.params.total,
        )

    app.notification_handlers[types.ProgressNotification] = _send_progress_notification

    async def _complete(req: types.CompleteRequest) -> types.ServerResult:
        result = await client_session.complete(
            req.params.ref,
            req.params.argument.model_dump(),
        )
        return types.ServerResult(result)

    app.request_handlers[types.CompleteRequest] = _complete

    return app
