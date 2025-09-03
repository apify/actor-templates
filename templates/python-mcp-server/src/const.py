from enum import Enum


class ChargeEvents(str, Enum):
    """Event types for charging MCP operations.

    These events are used to charge users for different types of MCP operations
    when running as an Apify Actor. Each event corresponds to a specific operation
    that can be charged for.

    The template includes both generic MCP operations and specific arXiv operations
    as examples. You can customize these events based on your specific MCP server needs.
    """

    # Generic MCP operations (can be used for any MCP server)
    ACTOR_START = 'actor-start'
    RESOURCE_READ = 'resource-read'
    TOOL_LIST = 'tool-list'
    PROMPT_GET = 'prompt-get'
    TOOL_CALL = 'tool-call'

    # arXiv-specific operations (example for domain-specific charging)
    SEARCH_PAPERS = 'search_papers'
    LIST_PAPERS = 'list_papers'
    DOWNLOAD_PAPER = 'download_paper'
    READ_PAPER = 'read_paper'


# Authorized tools list for MCP server
# Only tools listed here will be allowed to execute.
# To add new authorized tools, simply add the tool value to this list.
AUTHORIZED_TOOLS = [
    ChargeEvents.SEARCH_PAPERS.value,
    ChargeEvents.LIST_PAPERS.value,
    ChargeEvents.DOWNLOAD_PAPER.value,
    ChargeEvents.READ_PAPER.value,
]


# Helper function to get ChargeEvents enum from tool name
def get_charge_event(tool_name: str) -> ChargeEvents | None:
    """Get the ChargeEvents enum member from a tool name string."""
    for event in ChargeEvents:
        if event.value == tool_name:
            return event
    return None
