"""This module defines Pydantic models for this project.

These models are used mainly for the structured tool and LLM outputs.
Resources:
- https://docs.pydantic.dev/latest/concepts/models/
"""

from pydantic import BaseModel


class InstagramPost(BaseModel):
    """Instagram post model."""

    url: str
    likes: int
    comments: int
    timestamp: str
    caption: str | None = None
    alt: str | None = None


class AgentStructuredOutput(BaseModel):
    """Structured output for the ReAct agent."""

    total_likes: int
    total_comments: int
    most_popular_posts: list[InstagramPost]
