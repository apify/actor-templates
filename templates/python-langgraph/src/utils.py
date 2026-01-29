from __future__ import annotations

from apify import Actor
from langchain_core.messages import ToolMessage


def log_state(state: dict) -> None:
    """Log the state of the LangGraph agent using Actor.log.debug."""
    message = state['messages'][-1]

    # Log tool results when multiple tools are called in parallel
    if isinstance(message, ToolMessage):
        for msg in reversed(state['messages']):
            if hasattr(msg, 'tool_calls'):
                break
            Actor.log.debug('-------- Tool Result --------')
            Actor.log.debug('Tool: %s', msg.name)
            Actor.log.debug('Result: %s', msg.content)

    Actor.log.debug('-------- Message --------')
    Actor.log.debug('Message: %s', message)

    # Log tool calls if present
    for tool_call in getattr(message, 'tool_calls', []):
        Actor.log.debug('-------- Tool Call --------')
        Actor.log.debug('Tool: %s', tool_call['name'])
        Actor.log.debug('Args: %s', tool_call['args'])
