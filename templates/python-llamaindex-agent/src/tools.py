from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING, Any

import polars as pl
from apify_client import ApifyClientAsync
from llama_index.core.prompts import PromptTemplate

if TYPE_CHECKING:
    from llama_index.llms.openai import OpenAI

client = ApifyClientAsync(token=os.getenv('APIFY_TOKEN'))

CONTACT_DETAILS_ACTOR_ID = 'vdrmota/contact-info-scraper'
CONTACT_DETAILS_ACTOR_FIELDS = {'depth', 'originalStartUrl', 'url', 'referrerUrl'}

PROMPT_SUMMARIZE = PromptTemplate(
    'Scraped contact data is below.\n'
    '---------------------\n'
    '{scraped_data}\n'
    '---------------------\n'
    'Given the scraped contact information and no prior knowledge, '
    'summarize contact information in a concise and informative manner.\n'
    'Summary of contact details:'
)

logger = logging.getLogger('apify')


class LLMRegistry:
    """Registry for the OpenAI instance to be used by the tools."""

    _llm: OpenAI | None = None

    @classmethod
    def get(cls) -> OpenAI:
        """Get the OpenAI instance to be used by the tools."""
        if cls._llm is None:
            raise ValueError('OpenAI instance has not been set.')
        return cls._llm

    @classmethod
    def set(cls, new_llm: OpenAI) -> None:
        """Set the OpenAI instance to be used by the tools."""
        cls._llm = new_llm


async def call_contact_details_scraper(
    start_urls: list[dict[str, Any]],
    max_requests_per_start_url: int = 20,
    max_depth: int = 2,
    same_domain: bool = True,  # noqa:FBT001,FBT002
    deduplicate: bool = True,  # noqa:FBT001,FBT002
) -> list[dict]:
    """Extract contact details from websites using the Apify Actor.

    The Apify Contact Details Scraper is a tool for extracting and downloading various contact information,
    including emails, phone numbers, and social media profiles from websites. This function invokes the
    Apify Actor to process the provided list of URLs.

    The scraper retrieves contact details for every URL it encounters, with crawling behavior controlled by
    the max_depth and max_requests_per_start_url parameters.

    Since the scraper often produces a list of URLs with duplicate contact details, it is recommended to
    deduplicate the results.

    Args:
        start_urls: List of dictionaries containing the URLs to be scraped, for example: "startUrls": [{"url": "https://apify.com"}]
        max_requests_per_start_url: The maximum number of pages that will be enqueued from each start URL you provide.
        max_depth: Maximum link depth
        same_domain: If set, the scraper will only follow links within the same domain as the referring page.
        deduplicate: If set, this function will deduplicate the results.

    Returns:
        List of extracted details

        Sample output:
        [
            {
               "url": "https://apify.com/",
               "domain": "apify.com",
               "linkedIns": [ "https://www.linkedin.com/company/apifytech/" ],
               "twitters": [ "https://x.com/apify" ],
            },
            {
               "url": "https://apify.com/jobs",
               "domain": "apify.com",
            }
        ]
    """
    run_input = {
        'startUrls': start_urls,
        'maxRequestsPerStartUrl': max_requests_per_start_url,
        'maxDepth': max_depth,
        'sameDomain': same_domain,
    }
    logger.info(f'Calling Apify Actor: {CONTACT_DETAILS_ACTOR_ID} with input: {run_input}')
    actor_call = await client.actor(CONTACT_DETAILS_ACTOR_ID).call(run_input=run_input)
    dataset_items = await client.dataset(actor_call['defaultDatasetId']).list_items(clean=True)
    data = dataset_items.items
    logger.info('Received data from %s, nuber of records: %d', CONTACT_DETAILS_ACTOR_ID, len(data))

    if deduplicate:
        logger.info('Deduplicating contact information')
        df_data = pl.from_records(data)
        columns = list(set(df_data.columns) - CONTACT_DETAILS_ACTOR_FIELDS)
        data = df_data.unique(subset=columns).to_dicts()

    return data


async def summarize_contact_information(contact_information: list[dict]) -> str:
    """Summarize list of scraped contacts from the Contact Details Scraper.

    Args:
        contact_information (list[dict]): List of contact information obtained from the Contact Details Scraper.
        Sample input:
        [
            {
               "url": "https://apify.com/",
               "domain": "apify.com",
               "linkedIns": [ "https://www.linkedin.com/company/apifytech/" ],
               "twitters": [ "https://x.com/apify" ],
            },
            {
               "url": "https://apify.com/jobs",
               "domain": "apify.com",
            }
        ]

    Returns:
        response (str): Summarized data.
    """
    llm = LLMRegistry.get()
    logger.info('Summarizing contact information')
    return await llm.apredict(PROMPT_SUMMARIZE, scraped_data=contact_information)
