"""Compatibility boundary for Browser Use lifecycle ownership."""

from __future__ import annotations

from importlib.metadata import version
from typing import TYPE_CHECKING
from unittest.mock import patch

if TYPE_CHECKING:
    from browser_use import Agent
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


async def run_agent_with_actor_signals(agent: Agent, *, max_steps: int) -> AgentHistoryList:
    """Run an Agent without allowing Browser Use to replace Actor signal hooks."""
    installed = version('browser-use')
    if installed != PINNED_BROWSER_USE_VERSION:
        msg = (
            f'Browser Use {installed} is not supported; the signal-handler patch is certified only for '
            f'{PINNED_BROWSER_USE_VERSION}. On a release with `enable_signal_handler`, pass '
            '`enable_signal_handler=False` to `Agent` and drop this module.'
        )
        raise RuntimeError(msg)
    # Agent.run imports SignalHandler from browser_use.utils at runtime.
    with patch('browser_use.utils.SignalHandler', _ActorOwnedSignalHandler):
        return await agent.run(max_steps=max_steps)
