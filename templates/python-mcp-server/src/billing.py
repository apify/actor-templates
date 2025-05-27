"""
Billing module for MCP Server.
Handles charging for different types of MCP requests based on the method name.
"""

from apify import Actor
from pydantic import BaseModel


class MessageRequest(BaseModel):
    """Model for incoming message requests."""

    method: str


async def charge_message_request(args: MessageRequest) -> None:
    """Charge for different types of MCP requests based on the method name.

    See https://modelcontextprotocol.io/specification/2025-03-26/server for more details
    on the method names and protocol messages.

    Args:
        args: MessageRequest containing the method name
    """
    # Map method patterns to event names
    method_patterns = {
        '/list': 'list-request',
        'tools/': 'tool-request',
        'resources/': 'resource-request',
        'prompts/': 'prompt-request',
        'completion/': 'completion-request',
    }

    # Find matching event name
    event_name = next((event for pattern, event in method_patterns.items() if args.method.startswith(pattern)), None)

    if event_name:
        result = await Actor.charge(event_name)
        Actor.log.info(f'Charged {result.charged_count} {event_name} for method: {args.method}')
    else:
        Actor.log.info(f'No charge for method: {args.method}')
