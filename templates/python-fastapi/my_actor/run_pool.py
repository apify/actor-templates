"""Module finds out which pool of runs the current run belongs to.

A single-tenant Server Actor starts a run in each user's account. A multi-tenant Server Actor runs in your account,
and the platform keeps one pool of runs for each type of user.

| Pool                        | Serves                         | Event charges | Platform usage            |
| --------------------------- | ------------------------------ | ------------- | ------------------------- |
| `SINGLE_TENANT`             | One user, in their own account | The user pays | The user pays             |
| `MULTI_TENANT_PAYING_USERS` | Users on a paid plan           | The user pays | Deducted from your payout |
| `MULTI_TENANT_FREE_USERS`   | Users on a free plan           | The user pays | Covered by Apify          |
| `MULTI_TENANT_OWNER_PAID`   | You, the Actor's owner (*)     | Not charged   | Charged to your account   |

(*) And every user of a multi-tenant Actor that uses pay per usage instead of pay per event.

See https://docs.apify.com/actors/monetize/server-actors
"""

from __future__ import annotations

from apify import Actor


async def get_run_pool() -> str | None:
    """Return the pool of the current run, or `None` when the run was not started through the server interface.

    That is the case for local runs and for runs started through the input interface. A run stays in one pool for
    its whole life, so call this once at startup.
    """
    run_id = Actor.configuration.actor_run_id
    if not Actor.is_at_home() or run_id is None:
        return None

    run = await Actor.apify_client.run(run_id).get()
    if run is None or run.standby is None:
        return None

    return run.standby.deployment
