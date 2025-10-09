from enum import Enum

SESSION_TIMEOUT_SECS = 300  # 5 minutes


class ChargeEvents(str, Enum):
    """Event types for charging MCP operations.

    These events are used to charge users for different types of MCP operations
    when running as an Apify Actor. Each event corresponds to a specific operation
    that can be charged for.

    The template includes both generic MCP operations and specific arXiv operations
    as examples. You can customize these events based on your specific MCP server needs.
    """

    # Generic MCP operations (can be used for any MCP server)
    TOOL_CALL = 'tool-call'

    # arXiv-specific operations (example for domain-specific charging)
    SEARCH_PAPERS = 'search_papers'
    LIST_PAPERS = 'list_papers'
    DOWNLOAD_PAPER = 'download_paper'
    READ_PAPER = 'read_paper'


# Tool whitelist for MCP server
# Only tools listed here will be present to the user and allowed to execute.
# Format of the dictionary: {tool_name: (charge_event_name, default_count)}
# To add new authorized tools, add an entry with the tool name and its charging configuration.
TOOL_WHITELIST = {
    ChargeEvents.SEARCH_PAPERS.value: (ChargeEvents.SEARCH_PAPERS.value, 1),
    ChargeEvents.LIST_PAPERS.value: (ChargeEvents.LIST_PAPERS.value, 1),
    ChargeEvents.DOWNLOAD_PAPER.value: (ChargeEvents.DOWNLOAD_PAPER.value, 1),
    ChargeEvents.READ_PAPER.value: (ChargeEvents.READ_PAPER.value, 1),
}
