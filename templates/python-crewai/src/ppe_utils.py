from apify import Actor
from decimal import Decimal

async def charge_for_model_tokens(model_name: str, tokens: int):
    """
    Charges for the tokens used by a specific model.

    Args:
        model_name (str): The name of the model.
        tokens (int): The number of tokens to charge for.

    Raises:
        ValueError: If the model name is unknown.
    """
    tokens_millions = Decimal(tokens) / Decimal('1e6')

    if model_name == 'gpt-4o':
        await Actor.charge(event_name='openai-1m-tokens-gpt-4o', count=tokens_millions) # type: ignore
    elif model_name == 'gpt-4o-mini':
        await Actor.charge(event_name='openai-1m-tokens-gpt-4o-mini', count=tokens_millions) # type: ignore
    elif model_name == 'o1':
        await Actor.charge(event_name='openai-1m-tokens-o1', count=tokens_millions) # type: ignore
    elif model_name == 'o3-mini':
        await Actor.charge(event_name='openai-1m-tokens-o3-mini', count=tokens_millions) # type: ignore
    else:
        raise ValueError(f"Unknown model name: {model_name}")


async def charge_for_actor_start():
    """
    Charges for the Actor start event.

    This function calculates the memory usage in gigabytes and charges for the Actor start event accordingly.
    """
    count = (Actor.get_env()['memory_mbytes'] or 1024 + 1023) // 1024
    await Actor.charge(event_name='actor-start-gb', count=count)
