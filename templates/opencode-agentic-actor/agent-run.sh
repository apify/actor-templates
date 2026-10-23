#!/bin/sh
# Generic entry point: runs OpenCode headless over this directory (CLAUDE.md + .claude/skills).
# Same agent package as the Claude Code variant; only the harness differs.
set -eu
export APIFY_CLI_DISABLE_TELEMETRY=1
mkdir -p data/raw
apify actor get-input > data/input.json
max_steps=$(jq -r '.maxSteps // 60' data/input.json)
# The step limit goes into the built-in "build" agent; OpenCode has no cost limit of its own.
export OPENCODE_CONFIG_CONTENT="{\"agent\":{\"build\":{\"steps\":$max_steps}}}"

status=0
opencode run --format json "Do the task in CLAUDE.md. The input is in data/input.json." \
    > data/events.jsonl || status=$?

# Not `apify actor set-value` from stdin: it stores an empty record (Apify CLI 1.10.0).
curl -sS -X PUT "https://api.apify.com/v2/key-value-stores/$ACTOR_DEFAULT_KEY_VALUE_STORE_ID/records/AGENT_EVENTS" \
    -H "Authorization: Bearer $APIFY_TOKEN" -H 'Content-Type: application/x-ndjson' --data-binary @data/events.jsonl > /dev/null || true
echo "OpenCode exit $status, $(wc -l < data/events.jsonl) events"
items=$(curl -sS -H "Authorization: Bearer $APIFY_TOKEN" \
    "https://api.apify.com/v2/datasets/$ACTOR_DEFAULT_DATASET_ID" | jq -r '.data.itemCount // 0')
if [ "$status" -ne 0 ] || { [ "${ALLOW_EMPTY_OUTPUT:-0}" != 1 ] && [ "$items" -eq 0 ]; }; then
    tail -c 2000 data/events.jsonl >&2
    echo "Agent failed: exit $status, $items items" >&2
    exit 1
fi
echo "Pushed $items items"
