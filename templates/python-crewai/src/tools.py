"""This module defines the tools used by the agent.

Feel free to modify or add new tools to suit your specific needs.

To learn how to create a new tool, see:
- https://docs.crewai.com/concepts/tools
"""

from __future__ import annotations

import os

from apify import Actor
from apify_client import ApifyClient
from crewai.tools import BaseTool
from crewai.utilities.converter import ValidationError
from pydantic import BaseModel, Field

from src.models import InstagramPost, InstagramPosts


class InstagramScraperInput(BaseModel):
    """Input schema for InstagramScraper tool."""

    handle: str = Field(..., description="Instagram handle of the profile to scrape (without the '@' symbol).")
    max_posts: int = Field(default=30, description='Maximum number of posts to scrape.')


class InstagramScraperTool(BaseTool):
    """Tool for scraping Instagram profile posts."""

    name: str = 'Instagram Profile Posts Scraper'
    description: str = 'Tool to scrape Instagram profile posts.'
    args_schema: type[BaseModel] = InstagramScraperInput

    def _run(self, handle: str, max_posts: int = 30) -> list[InstagramPost]:
        run_input = {
            'directUrls': [f'https://www.instagram.com/{handle}/'],
            'resultsLimit': max_posts,
            'resultsType': 'posts',
            'searchLimit': 1,
        }
        if not (token := os.getenv('APIFY_TOKEN')):
            raise ValueError('APIFY_TOKEN environment variable is missing!')

        apify_client = ApifyClient(token=token)
        if not (run := apify_client.actor('apify/instagram-scraper').call(run_input=run_input)):
            msg = 'Failed to start the Actor apify/instagram-scraper'
            raise RuntimeError(msg)

        dataset_id = run['defaultDatasetId']
        dataset_items: list[dict] = (apify_client.dataset(dataset_id).list_items()).items

        try:
            posts: InstagramPosts = InstagramPosts.model_validate(dataset_items)
        except ValidationError as e:
            Actor.log.warning('Received invalid dataset items: %s. Error: %s', dataset_items, e)
            raise RuntimeError('Received invalid dataset items.') from e
        else:
            return posts.root
