"""Runtime validation of the Actor input."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from urllib.parse import urlsplit

DEFAULT_START_URL = 'https://news.ycombinator.com/'
DEFAULT_TASK = (
    'Return the title and exact destination URL of the first 5 post-title hyperlinks on the page, preserving their '
    'displayed order. Each URL must be the complete absolute HTTP or HTTPS href attached to the title text, including '
    'its full path and query; never use a source-domain label, vote, comments, user, age, or navigation link.'
)
DEFAULT_MODEL = 'google/gemini-2.5-flash'
MAX_TASK_CHARS = 4_000
MAX_POSTS = 10


@dataclass(frozen=True, slots=True)
class RunConfig:
    """Validated settings with hard runtime and cost bounds."""

    start_url: str
    task: str
    model: str
    max_posts: int
    max_steps: int
    deadline_secs: int
    action_delay_secs: float
    proxy_configuration: dict[str, object]


def _bounded_integer(value: object, fallback: int, minimum: int, maximum: int, field: str) -> int:
    resolved = fallback if value is None else value
    if isinstance(resolved, bool) or not isinstance(resolved, int) or not minimum <= resolved <= maximum:
        msg = f'{field} must be an integer between {minimum} and {maximum}'
        raise ValueError(msg)
    return resolved


def _bounded_number(value: object, fallback: float, minimum: float, maximum: float, field: str) -> float:
    resolved = fallback if value is None else value
    if isinstance(resolved, bool) or not isinstance(resolved, (int, float)) or not minimum <= resolved <= maximum:
        msg = f'{field} must be a number between {minimum} and {maximum}'
        raise ValueError(msg)
    return float(resolved)


def _http_url(value: object, field: str) -> str:
    url = str(value).strip()
    parts = urlsplit(url)
    if parts.scheme not in {'http', 'https'} or not parts.hostname:
        msg = f'{field} must be a valid HTTP or HTTPS URL'
        raise ValueError(msg)
    return url


def _proxy_configuration(value: object) -> dict[str, object]:
    if value is None:
        return {'useApifyProxy': True}
    if not isinstance(value, Mapping):
        msg = 'proxyConfiguration must be an object'
        raise TypeError(msg)
    return {str(key): item for key, item in value.items()}


def normalize_input(input_data: Mapping[str, object]) -> RunConfig:
    """Normalize input and repeat every important schema limit at runtime."""
    start_url = _http_url(input_data.get('startUrl', DEFAULT_START_URL), 'startUrl')

    task = str(input_data.get('task') or DEFAULT_TASK).strip()
    if not task:
        msg = 'task must not be empty'
        raise ValueError(msg)
    if len(task) > MAX_TASK_CHARS:
        msg = f'task must contain at most {MAX_TASK_CHARS} characters'
        raise ValueError(msg)

    model = str(input_data.get('model') or DEFAULT_MODEL).strip()
    if '/' not in model:
        msg = 'model must be a non-empty OpenRouter provider/model ID'
        raise ValueError(msg)

    return RunConfig(
        start_url=start_url,
        task=task,
        model=model,
        max_posts=_bounded_integer(input_data.get('maxPosts'), 5, 1, MAX_POSTS, 'maxPosts'),
        max_steps=_bounded_integer(input_data.get('maxSteps'), 15, 1, 50, 'maxSteps'),
        deadline_secs=_bounded_integer(input_data.get('deadlineSecs'), 180, 30, 300, 'deadlineSecs'),
        action_delay_secs=_bounded_number(input_data.get('actionDelaySecs'), 0.5, 0.5, 5, 'actionDelaySecs'),
        proxy_configuration=_proxy_configuration(input_data.get('proxyConfiguration')),
    )
