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

from .const import ChargeEvents

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from mcp.client.session import ClientSession
    from mcp.server.context import ServerRequestContext

logger = logging.getLogger('apify')


async def charge_mcp_operation(
    charge_function: Callable[[str, int], Awaitable[Any]] | None, event_name: str | None, count: int = 1
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
        await charge_function(event_name, count)
        logger.info(f'Charged for event: {event_name}')
    except Exception:
        logger.exception(f'Failed to charge for event {event_name}')
        # Don't raise the exception - we want the operation to continue even if charging fails


async def create_gateway(  # noqa: PLR0915
    client_session: ClientSession,
    actor_charge_function: Callable[[str, int], Awaitable[Any]] | None = None,
    tool_whitelist: dict[str, tuple[str, int]] | None = None,
) -> server.Server[object]:
    """Create a server instance from a remote app.

    Args:
        client_session: The MCP client session to proxy requests through
        actor_charge_function: Optional function to charge for operations.
                       Should accept (event_name: str, count: int).
                       Typically, Actor.charge in Apify Actors.
                       If None, no charging will occur.
        tool_whitelist: Optional dict mapping tool names to (event_name, default_count) tuples.
                       If provided, only whitelisted tools will be allowed and charged.
                       If None, all tools are allowed without specific charging.
    """
    logger.debug('Sending initialization request to remote MCP server...')
    response = await client_session.initialize()
    capabilities: types.ServerCapabilities = response.capabilities

    logger.debug('Configuring proxied MCP server...')

    # Handlers are passed to the Server constructor, so collect the ones the remote server
    # actually advertises and hand them over in one go.
    handlers: dict[str, Any] = {}

    if capabilities.prompts:
        logger.debug('Capabilities: adding Prompts...')

        async def _list_prompts(
            _ctx: ServerRequestContext[object], _params: types.PaginatedRequestParams | None
        ) -> types.ListPromptsResult:
            return await client_session.list_prompts()

        async def _get_prompt(
            _ctx: ServerRequestContext[object], params: types.GetPromptRequestParams
        ) -> types.GetPromptResult | types.InputRequiredResult:
            # Uncomment the line below to charge for getting prompts
            # await charge_mcp_operation(actor_charge_function, ChargeEvents.PROMPT_GET) # noqa: ERA001
            return await client_session.get_prompt(params.name, params.arguments)

        handlers['on_list_prompts'] = _list_prompts
        handlers['on_get_prompt'] = _get_prompt

    if capabilities.resources:
        logger.debug('Capabilities: adding Resources...')

        async def _list_resources(
            _ctx: ServerRequestContext[object], _params: types.PaginatedRequestParams | None
        ) -> types.ListResourcesResult:
            return await client_session.list_resources()

        async def _list_resource_templates(
            _ctx: ServerRequestContext[object], _params: types.PaginatedRequestParams | None
        ) -> types.ListResourceTemplatesResult:
            return await client_session.list_resource_templates()

        async def _read_resource(
            _ctx: ServerRequestContext[object], params: types.ReadResourceRequestParams
        ) -> types.ReadResourceResult | types.InputRequiredResult:
            # Uncomment the line below to charge for reading resources
            # await charge_mcp_operation(actor_charge_function, ChargeEvents.RESOURCE_READ)  # noqa: ERA001
            return await client_session.read_resource(params.uri)

        # resources/subscribe and resources/unsubscribe are gone from the 2026-07-28 spec, but
        # the proxy still forwards them so it keeps working in front of a 2025-era remote server.
        async def _subscribe_resource(
            _ctx: ServerRequestContext[object], params: types.SubscribeRequestParams
        ) -> types.EmptyResult:
            return await client_session.subscribe_resource(params.uri)  # ty: ignore[deprecated]

        async def _unsubscribe_resource(
            _ctx: ServerRequestContext[object], params: types.UnsubscribeRequestParams
        ) -> types.EmptyResult:
            return await client_session.unsubscribe_resource(params.uri)  # ty: ignore[deprecated]

        handlers['on_list_resources'] = _list_resources
        handlers['on_list_resource_templates'] = _list_resource_templates
        handlers['on_read_resource'] = _read_resource
        handlers['on_subscribe_resource'] = _subscribe_resource
        handlers['on_unsubscribe_resource'] = _unsubscribe_resource

    if capabilities.tools:
        logger.debug('Capabilities: adding Tools...')

        async def _list_tools(
            _ctx: ServerRequestContext[object], _params: types.PaginatedRequestParams | None
        ) -> types.ListToolsResult:
            tools = await client_session.list_tools()

            # Filter tools to only include authorized ones if whitelist is provided
            if tool_whitelist:
                authorized_tools = []
                for tool in tools.tools:
                    if tool.name in tool_whitelist:
                        authorized_tools.append(tool)  # noqa: PERF401
                tools.tools = authorized_tools

            return tools

        async def _call_tool(
            _ctx: ServerRequestContext[object], params: types.CallToolRequestParams
        ) -> types.CallToolResult | types.InputRequiredResult:
            tool_name = params.name
            arguments = params.arguments or {}

            # Safe diagnostic logging for every tool call
            logger.info(f"Received tool call, tool: '{tool_name}', arguments: {arguments}")

            # Tool whitelisting and charging logic
            if tool_whitelist and tool_name not in tool_whitelist:
                error_message = (
                    f"The requested tool '{tool_name or 'unknown'}' is not authorized."
                    f' Authorized tools are: {list(tool_whitelist.keys())}'
                )
                logger.error(f'Blocking unauthorized tool call for: {tool_name or "unknown tool"}')
                return types.CallToolResult(content=[types.TextContent(type='text', text=error_message)], is_error=True)

            try:
                logger.info(f"Tool call. Tool: '{tool_name}', Arguments: {arguments}")
                result = await client_session.call_tool(tool_name, arguments)
                logger.info(f'Tool executed successfully: {tool_name}')

                # Determine event name and count for charging (default to TOOL_CALL if not whitelisted)
                default_tool_call = ChargeEvents.TOOL_CALL.value, 1
                event_name, default_count = (
                    tool_whitelist.get(tool_name, default_tool_call) if tool_whitelist else default_tool_call
                )
                await charge_mcp_operation(actor_charge_function, event_name, default_count)
            except Exception as e:
                error_details = f"SERVER FAILED. Tool: '{tool_name}'. Arguments: {arguments}. Full exception: {e}"
                logger.exception(error_details)
                return types.CallToolResult(content=[types.TextContent(type='text', text=error_details)], is_error=True)
            return result

        handlers['on_list_tools'] = _list_tools
        handlers['on_call_tool'] = _call_tool

    if capabilities.completions:
        logger.debug('Capabilities: adding Completions...')

        async def _complete(
            _ctx: ServerRequestContext[object], params: types.CompleteRequestParams
        ) -> types.CompleteResult:
            return await client_session.complete(
                params.ref,
                params.argument.model_dump(),
            )

        handlers['on_completion'] = _complete

    return server.Server(
        name=response.server_info.name,
        version=response.server_info.version,
        **handlers,
    )
