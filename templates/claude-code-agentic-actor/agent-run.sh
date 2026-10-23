#!/bin/sh
# Generic entry point: runs Claude Code headless over this directory (CLAUDE.md + .claude/skills).
# Nothing here is specific to one Actor; in the proposal it ships in the base image.
set -eu

# LLM calls go through the apify/openrouter gateway on the run's token, so the user who runs the
# Actor pays for tokens. Its /api/v1/messages endpoint speaks the Anthropic format.
export ANTHROPIC_BASE_URL="${LLM_GATEWAY_URL:-https://openrouter.apify.actor/api}"
export ANTHROPIC_AUTH_TOKEN="$APIFY_TOKEN"
export ANTHROPIC_API_KEY=""
export ANTHROPIC_MODEL="${AGENT_MODEL:-anthropic/claude-haiku-4.5}"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$ANTHROPIC_MODEL"
export CLAUDE_CODE_SUBAGENT_MODEL="$ANTHROPIC_MODEL"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export DISABLE_AUTOUPDATER=1

# Headless runs have no trust dialog; without this, Claude Code ignores the project's
# .claude/settings.json (permissions and hooks) and dontAsk refuses every Bash call (seen in production).
printf '{"hasCompletedOnboarding": true, "projects": {"%s": {"hasTrustDialogAccepted": true}}}\n' "$(pwd)" \
    > "$HOME/.claude.json"

export APIFY_CLI_DISABLE_TELEMETRY=1
mkdir -p data/raw
apify actor get-input > data/input.json
max_turns=$(jq -r '.maxSteps // 60' data/input.json)
max_budget=$(jq -r '.maxBudgetUsd // 3' data/input.json)

status=0
claude -p "Do the task in CLAUDE.md. The input is in data/input.json." \
    --output-format json \
    --max-turns "$max_turns" \
    --max-budget-usd "$max_budget" \
    --permission-mode dontAsk \
    > data/result.json || status=$?

# Not `apify actor set-value` from stdin: it stores an empty record (Apify CLI 1.10.0).
curl -sS -X PUT "https://api.apify.com/v2/key-value-stores/$ACTOR_DEFAULT_KEY_VALUE_STORE_ID/records/AGENT_RESULT" \
    -H "Authorization: Bearer $APIFY_TOKEN" -H 'Content-Type: application/json' --data-binary @data/result.json > /dev/null || true
summary=$(jq -r '.result // .subtype // "no result"' data/result.json 2>/dev/null | head -c 900 || echo "no result")
echo "Claude Code exit $status: $(jq -c '{subtype, num_turns, total_cost_usd, is_error, permission_denials}' data/result.json 2>/dev/null | head -c 3000)"

if [ "$status" -ne 0 ] || [ "$(jq -r '.is_error' data/result.json 2>/dev/null)" = "true" ]; then
    echo "Agent failed: $summary" >&2
    exit 1
fi
# A run that pushed nothing failed, whatever the agent said (it once "succeeded" with no tools allowed).
items=$(curl -sS -H "Authorization: Bearer $APIFY_TOKEN" \
    "https://api.apify.com/v2/datasets/$ACTOR_DEFAULT_DATASET_ID" | jq -r '.data.itemCount // 0')
if [ "${ALLOW_EMPTY_OUTPUT:-0}" != 1 ] && [ "$items" -eq 0 ]; then
    echo "Agent pushed no items: $summary" >&2
    exit 1
fi
echo "$summary"
