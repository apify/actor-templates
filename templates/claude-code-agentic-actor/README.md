# Agentic Actor (Claude Code harness)

An Actor with no Actor-specific code. The image runs Claude Code headless (`claude -p`) over this
directory; the Actor is only content:

```text
CLAUDE.md                          main prompt: goal, procedure, output contract
.claude/skills/<name>/SKILL.md     Agent Skills, with scripts/
.claude/skills/apify-actor-runtime the generic skill for input, running Actors and output, from the shell
.claude/settings.json              permissions and a PreToolUse hook
.claude/hooks/actor-allowlist.sh   lets Bash run only allowlisted Actors, and only with maxTotalChargeUsd
.actor/                            input, dataset and output schemas
agent-run.sh                       generic entry point (in the proposal it ships in a base image)
```

- **I/O**: the agent uses the Apify CLI (`apify actor get-input`, `apify actor push-data`) and the
  API through `curl`.
- **Model**: billed to the user through `apify/openrouter`'s Anthropic-format endpoint
  (`ANTHROPIC_BASE_URL`), authenticated with the run token.

Findings from platform runs on 2026-10-23, all handled here:

- Headless Claude Code ignores `.claude/settings.json` until the project is trusted, so `agent-run.sh`
  writes the trust flag to `~/.claude.json`.
- Prefix permission rules (`Bash(curl:*)`) do not match the multi-line shell commands agents write,
  so `Bash` is allowed and policy lives in the deny rules and the hook.
- `apify actor set-value KEY < file` stores an empty record (Apify CLI 1.10.0), so files go to the
  key-value store with `curl -X PUT`.
- `--max-budget-usd` uses Claude Code's own price table. For a model it doesn't know, it reported
  $1.08 where the platform charged about $0.29.
- A run that pushed no items is failed, whatever the agent says.
