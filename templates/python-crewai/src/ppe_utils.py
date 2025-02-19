from decimal import ROUND_CEILING, Decimal

from apify import Actor

MODEL_PPE_EVENT = {
    'gpt-4o': 'openai-100-tokens-gpt-4o',
    'gpt-4o-mini': 'openai-100-tokens-gpt-4o-mini',
    'o1': 'openai-100-tokens-o1',
    'o3-mini': 'openai-100-tokens-o3-mini',
}


async def charge_for_model_tokens(model_name: str, tokens: int) -> None:
    """Charges for the tokens used by a specific model.

    Args:
        model_name (str): The name of the model.
        tokens (int): The number of tokens to charge for.

    Raises:
        ValueError: If the model name is unknown.
    """
    tokens_hundreds = int((Decimal(tokens) / Decimal('1e2')).to_integral_value(rounding=ROUND_CEILING))
    Actor.log.debug(f'Charging for {tokens} tokens ({tokens_hundreds} hundreds) for model {model_name}')

    if not (event_name := MODEL_PPE_EVENT.get(model_name)):
        raise ValueError(f'Unknown model name: {model_name}')

    await Actor.charge(event_name=event_name, count=tokens_hundreds)


async def charge_for_actor_start() -> None:
    """Charges for the Actor start event.

    This function calculates the memory usage in gigabytes and charges for the Actor start event accordingly.
    """
    count = (Actor.get_env()['memory_mbytes'] or 1024 + 1023) // 1024
    await Actor.charge(event_name='actor-start-gb', count=count)
