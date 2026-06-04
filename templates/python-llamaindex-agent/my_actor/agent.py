from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from llama_index.core.agent import AgentOutput, ReActAgent, ToolCall, ToolCallResult
from llama_index.core.tools import FunctionTool

from .tools import LLMRegistry, call_contact_details_scraper, summarize_contact_information

if TYPE_CHECKING:
    from llama_index.llms.openai import OpenAI

logger = logging.getLogger('apify')


async def run_agent(query: str, llm: OpenAI, *, verbose: bool = False) -> AgentOutput:
    """Run an agent to scrape contact details and process it using LLM and tools.

    The function initializes a ReAct agent with specific tools to process a user-provided query.

    Args:
        query: Query string provided by the user for processing.
        llm: The language model to be used for processing.
        verbose: Flag to enable verbose logging of the agent's tool calls and their results.

    Returns:
        The agent output containing the response.
    """
    LLMRegistry.set(llm)

    # Initialize the ReAct Agent with the Tools (LLM not pre-instantiated)
    agent = ReActAgent(
        tools=[
            FunctionTool.from_defaults(fn=call_contact_details_scraper),
            FunctionTool.from_defaults(fn=summarize_contact_information),
        ],
        llm=llm,
    )

    # Run the agent and, when verbose logging is enabled, stream its workflow events to
    # surface the reasoning steps (tool calls and their results) as they happen.
    handler = agent.run(user_msg=query)
    if verbose:
        async for event in handler.stream_events():
            if isinstance(event, ToolCall):
                logger.info(f'Calling tool {event.tool_name} with args {event.tool_kwargs}')
            elif isinstance(event, ToolCallResult):
                logger.info(f'Tool {event.tool_name} returned {event.tool_output}')

    response: AgentOutput = await handler
    logger.info(f'Agent answer: {response.response}')
    return response
