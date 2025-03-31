from dataclasses import dataclass

from pydantic_ai import Agent, RunContext, Tool


@dataclass
class Deps:
    """Dependencies."""

    joke_topic: str


async def create_joke(ctx: RunContext[Deps]) -> str:
    """Create a joke using AI agent."""
    joker = Agent(
        'openai:gpt-4o',
        result_type=str,
        system_prompt='You are a joke creation agent.',
    )
    return (await joker.run(user_prompt=ctx.deps.joke_topic)).data


def get_joker_agent() -> Agent:
    """Get a joke creation agent."""
    return Agent(
        'openai:gpt-4o',
        result_type=str,
        system_prompt=(
            'Use `create_joke` tool to create four jokes, select the best one and return it without any other comments.'
        ),
        deps_type=Deps,  # type: ignore[arg-type]
        tools=[Tool(create_joke, takes_ctx=True)],
    )
