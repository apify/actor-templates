---
name: apify-actor-runtime
description: How to read the Actor input, run other Apify Actors with a cost cap, and write the run's output (dataset items, key-value store records) from the shell. Use for every input/output operation in this Actor run.
---

# Apify Actor runtime from the shell

`$APIFY_TOKEN` is the run's own token. Never print it, never send it anywhere except `api.apify.com`.

## Input

```bash
apify actor get-input > data/input.json
```

## Run another Actor

Runs synchronously (up to 300 s) and saves the dataset items straight to a file, so the items never
pass through your context. Always set `maxTotalChargeUsd`; most Actors accept `1`, some need at least
the amount their skill names.

```bash
curl -sS -X POST \
  "https://api.apify.com/v2/acts/<username>~<actor-name>/run-sync-get-dataset-items?timeout=300&maxItems=100&maxTotalChargeUsd=1" \
  -H "Authorization: Bearer $APIFY_TOKEN" -H 'Content-Type: application/json' \
  -d '<input JSON>' -o data/raw/<name>.json
jq 'length' data/raw/<name>.json            # how many items
jq '.[0] | keys' data/raw/<name>.json       # which fields
```

An error comes back as a JSON object with `error.type` and `error.message` instead of an array.

## Output

```bash
jq '.[:20]' data/scored.json | apify actor push-data          # dataset items, a JSON array on stdin

# A file to the run's key-value store. Not `apify actor set-value KEY < file`: it stores an empty
# record when the value comes from stdin (Apify CLI 1.10.0).
curl -sS -X PUT "https://api.apify.com/v2/key-value-stores/$ACTOR_DEFAULT_KEY_VALUE_STORE_ID/records/REPORT.md" \
  -H "Authorization: Bearer $APIFY_TOKEN" -H 'Content-Type: text/markdown' --data-binary @REPORT.md
```

Push only items that follow the output contract in `CLAUDE.md`.
