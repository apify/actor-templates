from dataclasses import dataclass

from pydantic_ai import Agent, Tool, RunContext


@dataclass
class Deps:
    joke_topic: str


async def create_joke(ctx: RunContext[Deps]) -> str:
    joker = Agent(
        "openai:gpt-4o",
        result_type=str,
        system_prompt="You are a joke creation agent.",
    )
    return await joker.run(user_prompt=ctx.deps.joke_topic)


def get_joker_agent():
    return Agent(
        "openai:gpt-4o",
        result_type=str,
        system_prompt=(
            "Use `create_joke` tool to create four jokes, select the best one and return it without any other comments."
        ),
        deps_type=Deps,
        tools=[Tool(create_joke, takes_ctx=True)],
    )
