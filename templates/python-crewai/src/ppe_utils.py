from apify import Actor


async def charge_for_actor_start() -> None:
    """Charges for the Actor start event.

    This function calculates the memory usage in gigabytes and charges for the Actor start event accordingly.
    """
    count = max(1, (Actor.get_env()['memory_mbytes'] or 1024) // 1024)
    await Actor.charge(event_name='actor-start-gb', count=count)
