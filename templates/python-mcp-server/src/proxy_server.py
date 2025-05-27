"""Create an MCP server that proxies requests through an MCP client.

This server is created independent of any transport mechanism.
Source: https://github.com/sparfenyuk/mcp-proxy

The server can optionally charge for MCP operations using a provided charging function.
This is typically used in Apify Actors to charge users for different types of MCP operations
like tool calls, prompt operations, or resource access.
"""

import logging
from typing import Any, Callable, Optional

from mcp import server, types
from mcp.client.session import ClientSession

from .const import ChargeEvents

logger = logging.getLogger(__name__)


async def _charge_mcp_operation(
    charge_function: Optional[Callable[[str], None]],
    event_name: ChargeEvents,
) -> None:
    """Charge for an MCP operation if a charge function is provided."""
    if not charge_function:
        return

    try:
        await charge_function(event_name.value)
        logger.info(f'Charged for event {event_name.value}')
    except Exception as e:
        logger.error(f'Failed to charge for event {event_name.value}: {e}')
        # Don't raise the exception - we want the operation to continue even if charging fails


async def create_proxy_server(
    client_session: ClientSession, actor_charge_function: Optional[Callable[[str, Optional[dict]], None]] = None
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
    app: server.Server[object] = server.Server(name=response.serverInfo.name, version=response.serverInfo.version)

    if capabilities.prompts:
        logger.debug('Capabilities: adding Prompts...')

        async def _list_prompts(_: Any) -> types.ServerResult:  # noqa: ANN401
            await _charge_mcp_operation(actor_charge_function, ChargeEvents.PROMPT_LIST)
            result = await client_session.list_prompts()
            return types.ServerResult(result)

        app.request_handlers[types.ListPromptsRequest] = _list_prompts

        async def _get_prompt(req: types.GetPromptRequest) -> types.ServerResult:
            await _charge_mcp_operation(actor_charge_function, ChargeEvents.PROMPT_GET)
            result = await client_session.get_prompt(req.params.name, req.params.arguments)
            return types.ServerResult(result)

        app.request_handlers[types.GetPromptRequest] = _get_prompt

    if capabilities.resources:
        logger.debug('Capabilities: adding Resources...')

        async def _list_resources(_: Any) -> types.ServerResult:  # noqa: ANN401
            await _charge_mcp_operation(actor_charge_function, ChargeEvents.RESOURCE_LIST)
            result = await client_session.list_resources()
            return types.ServerResult(result)

        app.request_handlers[types.ListResourcesRequest] = _list_resources

        async def _list_resource_templates(_: Any) -> types.ServerResult:  # noqa: ANN401
            result = await client_session.list_resource_templates()
            return types.ServerResult(result)

        app.request_handlers[types.ListResourceTemplatesRequest] = _list_resource_templates

        async def _read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
            await _charge_mcp_operation(actor_charge_function, ChargeEvents.RESOURCE_READ)
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

        async def _list_tools(_: Any) -> types.ServerResult:  # noqa: ANN401
            await _charge_mcp_operation(actor_charge_function, ChargeEvents.TOOL_LIST)
            tools = await client_session.list_tools()
            return types.ServerResult(tools)

        app.request_handlers[types.ListToolsRequest] = _list_tools

        async def _call_tool(req: types.CallToolRequest) -> types.ServerResult:
            await _charge_mcp_operation(actor_charge_function, ChargeEvents.TOOL_CALL)
            try:
                result = await client_session.call_tool(req.params.name, (req.params.arguments or {}))
                return types.ServerResult(result)
            except Exception as e:  # noqa: BLE001
                return types.ServerResult(
                    types.CallToolResult(content=[types.TextContent(type='text', text=str(e))], isError=True),
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
