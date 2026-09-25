"""Compatibility boundary for Browser Use lifecycle ownership.

Browser Use installs its own SIGINT and SIGTERM handlers during `Agent.run`, which would take signal handling away
from the Apify Actor. Releases from 0.12.6 on accept `enable_signal_handler=False`; older releases get their
`SignalHandler` replaced with a no-op for the duration of the run.
"""

from __future__ import annotations

from contextlib import nullcontext
from inspect import signature
from typing import TYPE_CHECKING
from unittest.mock import patch

from browser_use import Agent

if TYPE_CHECKING:
    from browser_use.agent.views import AgentHistoryList

SUPPORTS_SIGNAL_OPTION = 'enable_signal_handler' in signature(Agent).parameters


class _ActorOwnedSignalHandler:
    """No-op replacement that leaves SIGINT and SIGTERM with the Apify Actor."""

    def __init__(self, *_args: object, **_kwargs: object) -> None:
        pass

    def register(self) -> None:
        pass

    def reset(self) -> None:
        pass

    def unregister(self) -> None:
        pass


def agent_signal_options() -> dict[str, object]:
    """Return `Agent` keyword arguments that disable Browser Use's signal handlers, where the release supports it."""
    return {'enable_signal_handler': False} if SUPPORTS_SIGNAL_OPTION else {}


async def run_agent_with_actor_signals(agent: Agent, *, max_steps: int) -> AgentHistoryList:
    """Run an Agent without allowing Browser Use to replace Actor signal hooks."""
    # Agent.run imports SignalHandler from browser_use.utils at runtime.
    context = (
        nullcontext() if SUPPORTS_SIGNAL_OPTION else patch('browser_use.utils.SignalHandler', _ActorOwnedSignalHandler)
    )
    with context:
        return await agent.run(max_steps=max_steps)
