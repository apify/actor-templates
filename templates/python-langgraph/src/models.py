"""Module defines Pydantic models for this project.

These models are used mainly for the structured tool and LLM outputs.
Resources:
- https://docs.pydantic.dev/latest/concepts/models/
"""

from __future__ import annotations

from pydantic import BaseModel


class InstagramPost(BaseModel):
    """Instagram post data returned by the `tool_scrape_instagram_profile_posts` tool."""

    url: str
    likes: int
    comments: int
    timestamp: str
    caption: str | None = None
    alt: str | None = None


class AgentStructuredOutput(BaseModel):
    """Structured output returned by the ReAct agent."""

    total_likes: int
    total_comments: int
    most_popular_posts: list[InstagramPost]
