from enum import StrEnum


class ChargeEvents(StrEnum):
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
    # The names must match the events defined in .actor/pay_per_event.json
    SEARCH_PAPERS = 'search-papers'
    LIST_PAPERS = 'list-papers'
    DOWNLOAD_PAPER = 'download-paper'
    READ_PAPER = 'read-paper'


# Tool whitelist for MCP server
# Only tools listed here will be present to the user and allowed to execute.
# Format of the dictionary: {tool_name: (charge_event_name, default_count)}
# To add new authorized tools, add an entry with the tool name and its charging configuration.
TOOL_WHITELIST = {
    'search_papers': (ChargeEvents.SEARCH_PAPERS.value, 1),
    'list_papers': (ChargeEvents.LIST_PAPERS.value, 1),
    'download_paper': (ChargeEvents.DOWNLOAD_PAPER.value, 1),
    'read_paper': (ChargeEvents.READ_PAPER.value, 1),
}
