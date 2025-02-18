from apify import Actor
from langchain_core.messages import ToolMessage


def log_state(state: dict) -> None:
    """Logs the state of the graph.

    Uses the `Actor.log.debug` method to log the state of the graph.

    Args:
        state (dict): The state of the graph.
    """
    message = state['messages'][-1]
    # Traverse all tool messages and print them
    # if multiple tools are called in parallel
    if isinstance(message, ToolMessage):
        # Until the analyst message with tool_calls
        for _message in state['messages'][::-1]:
            if hasattr(_message, 'tool_calls'):
                break
            Actor.log.debug('-------- Tool Result --------')
            Actor.log.debug('Tool: %s', _message.name)
            Actor.log.debug('Result: %s', _message.content)

    Actor.log.debug('-------- Message --------')
    Actor.log.debug('Message: %s', message)

    # Print all tool calls
    if hasattr(message, 'tool_calls'):
        for tool_call in getattr(message, 'tool_calls', []):
            Actor.log.debug('-------- Tool Call --------')
            Actor.log.debug('Tool: %s', tool_call['name'])
            Actor.log.debug('Args: %s', tool_call['args'])
