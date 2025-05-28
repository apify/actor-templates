from enum import Enum


class ChargeEvents(str, Enum):
    """Event types for charging MCP operations.

    These events are used to charge users for different types of MCP operations
    when running as an Apify Actor. Each event corresponds to a specific operation
    that can be charged for, such as tool calls, resource access, or prompt operations.
    """

    ACTOR_START = 'actor-start'
    RESOURCE_LIST = 'resource-list'
    RESOURCE_READ = 'resource-read'
    PROMPT_LIST = 'prompt-list'
    PROMPT_GET = 'prompt-get'
    TOOL_LIST = 'tool-list'
    TOOL_CALL = 'tool-call'
