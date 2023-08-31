import asyncio
from asyncio import AbstractEventLoop
from types import TracebackType
from typing import Type


class EventLoopManager:
    """
    Context manager for managing custom event loop.

    This context manager provides a way to create and manage a custom event loop
    within a with statement. The event loop will be stopped and closed when the
    context manager exits, regardless of whether an exception is raised.
    """

    def __enter__(self) -> AbstractEventLoop:
        """
        Enter the context manager and create a new event loop.

        Returns:
            The new event loop.
        """
        self.event_loop = asyncio.new_event_loop()
        return self.event_loop

    def __exit__(
        self,
        exc_type: None | Type[BaseException],
        exc_value: None | BaseException,
        traceback: None | TracebackType,
    ):
        """
        Exit the context manager, stop and close the event loop.
        """
        self.event_loop.stop()
        self.event_loop.close()


def get_running_event_loop_id() -> int:
    """
    Get the ID of the currently running event loop.

    It could be useful mainly for debugging purposes.

    Returns:
        The ID of the event loop.
    """
    return id(asyncio.get_running_loop())
