import logging

from llama_index.core.agent import ReActAgent
from llama_index.core.chat_engine.types import AgentChatResponse
from llama_index.core.tools import FunctionTool
from llama_index.llms.openai import OpenAI

from .tools import LLMRegistry, call_contact_details_scraper, summarize_contact_information

logger = logging.getLogger('apify')


async def run_agent(query: str, llm: OpenAI, *, verbose: bool = False) -> AgentChatResponse:
    """Runs an agent to scrape contact details and process it using LLM and tools.

    The function initializes a ReAct agent with specific tools to process a user-provided query.

    Args:
        query: Query string provided by the user for processing.
        llm: The language model to be used for processing.
        verbose: Flag to enable verbose logging.

    Returns:
        A string containing the response from the agent.
    """
    LLMRegistry.set(llm)

    # Initialize the ReAct Agent with the Tools (LLM not pre-instantiated)
    agent = ReActAgent.from_tools(
        [
            FunctionTool.from_defaults(fn=call_contact_details_scraper),
            FunctionTool.from_defaults(fn=summarize_contact_information),
        ],
        llm=llm,
        verbose=verbose,
    )

    response: AgentChatResponse = await agent.achat(query)
    logger.info(f'Agent answer: {response.response}')
    return response
