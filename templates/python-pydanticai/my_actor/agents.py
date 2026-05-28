import os
from dataclasses import dataclass

from pydantic_ai import Agent, RunContext, Tool
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

# Route all LLM calls through the Apify-hosted OpenRouter proxy
# (https://apify.com/apify/openrouter): an OpenAI-compatible endpoint billed
# against the run's Apify account, so no provider API key is needed. The proxy
# authenticates via `Authorization: Bearer $APIFY_TOKEN`, which is what the
# OpenAI client sends when api_key=APIFY_TOKEN.
OPENROUTER_BASE_URL = 'https://openrouter.apify.actor/api/v1'


def _build_provider() -> OpenAIProvider:
    return OpenAIProvider(base_url=OPENROUTER_BASE_URL, api_key=os.environ['APIFY_TOKEN'])


@dataclass
class Deps:
    """Dependencies."""

    joke_topic: str
    model_name: str


async def create_joke(ctx: RunContext[Deps]) -> str:
    """Create a joke using AI agent."""
    joker = Agent(
        OpenAIChatModel(ctx.deps.model_name, provider=_build_provider()),
        output_type=str,
        system_prompt='You are a joke creation agent.',
    )
    return (await joker.run(user_prompt=ctx.deps.joke_topic)).output


def get_joker_agent(model_name: str) -> Agent[Deps, str]:
    """Get a joke creation agent."""
    return Agent(
        OpenAIChatModel(model_name, provider=_build_provider()),
        output_type=str,
        system_prompt=(
            'Use `create_joke` tool to create four jokes, select the best one and return it without any other comments.'
        ),
        deps_type=Deps,
        tools=[Tool(create_joke, takes_ctx=True)],
    )
