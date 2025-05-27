"""
Billing module for MCP Server.
Handles charging for different types of MCP requests based on the method name.
"""

from enum import Enum


class ChargeEvents(str, Enum):
    """Event types for charging operations."""

    ACTOR_START = 'actor-start'
    RESOURCE_LIST = 'resource-list'
    RESOURCE_READ = 'resource-read'
    PROMPT_LIST = 'prompt-list'
    PROMPT_GET = 'prompt-get'
    TOOL_LIST = 'tool-list'
    TOOL_CALL = 'tool-call'
