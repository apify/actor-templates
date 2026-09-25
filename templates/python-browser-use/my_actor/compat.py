"""Compatibility boundary for Browser Use lifecycle ownership."""

from __future__ import annotations

from contextlib import nullcontext
from importlib.metadata import version
from inspect import signature
from typing import TYPE_CHECKING
from unittest.mock import patch

from browser_use import Agent

if TYPE_CHECKING:
    from contextlib import AbstractContextManager

    from browser_use.agent.views import AgentHistoryList

PINNED_BROWSER_USE_VERSION = '0.11.5'


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


def agent_supports_signal_control() -> bool:
    """Return whether the installed Agent exposes the public signal option."""
    return 'enable_signal_handler' in signature(Agent).parameters


def actor_owned_signals() -> AbstractContextManager[object]:
    """Disable Browser Use's legacy signal hooks for the audited pinned release."""
    if agent_supports_signal_control():
        return nullcontext()
    installed = version('browser-use')
    if installed != PINNED_BROWSER_USE_VERSION:
        msg = (
            f'Browser Use {installed} lacks enable_signal_handler; '
            f'the lifecycle adapter is certified only for {PINNED_BROWSER_USE_VERSION}'
        )
        raise RuntimeError(msg)
    # Agent.run imports SignalHandler from browser_use.utils at runtime.
    return patch('browser_use.utils.SignalHandler', _ActorOwnedSignalHandler)


async def run_agent_with_actor_signals(agent: Agent, *, max_steps: int) -> AgentHistoryList:
    """Run an Agent without allowing Browser Use to replace Actor signal hooks."""
    with actor_owned_signals():
        return await agent.run(max_steps=max_steps)
