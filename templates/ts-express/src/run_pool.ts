import { Actor } from 'apify';

/**
 * The pool of runs that this run belongs to. A single-tenant Server Actor starts a run in each user's account.
 * A multi-tenant Server Actor runs in your account, and the platform keeps one pool of runs for each type of user.
 *
 * | Pool                        | Serves                           | Event charges | Platform usage            |
 * | --------------------------- | -------------------------------- | ------------- | ------------------------- |
 * | `SINGLE_TENANT`             | One user, in their own account   | The user pays | The user pays             |
 * | `MULTI_TENANT_PAYING_USERS` | Users on a paid plan             | The user pays | Deducted from your payout |
 * | `MULTI_TENANT_FREE_USERS`   | Users on a free plan             | The user pays | Covered by Apify          |
 * | `MULTI_TENANT_OWNER_PAID`   | You, the Actor's owner (*)       | Not charged   | Charged to your account   |
 *
 * (*) And every user of a multi-tenant Actor that uses pay per usage instead of pay per event.
 *
 * See https://docs.apify.com/actors/monetize/server-actors
 */
export type RunPool =
    'SINGLE_TENANT' | 'MULTI_TENANT_PAYING_USERS' | 'MULTI_TENANT_FREE_USERS' | 'MULTI_TENANT_OWNER_PAID';

/**
 * Returns the pool of the current run, or `null` when the run was not started through the server interface.
 * That is the case for local runs and for runs started through the input interface.
 *
 * A run stays in one pool for its whole life, so call this once at startup.
 */
export async function getRunPool(): Promise<RunPool | null> {
    const runId = Actor.config.get('actorRunId');
    if (!Actor.isAtHome() || !runId) return null;

    const run = await Actor.apifyClient.run(runId).get();
    return run?.standby?.deployment ?? null;
}
