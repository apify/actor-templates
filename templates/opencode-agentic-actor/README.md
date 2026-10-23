# Agentic Actor (OpenCode harness)

The same agent package as the Claude Code variant (`CLAUDE.md`, `.claude/skills/`), run by OpenCode
(MIT) headless with `opencode run`. Only `opencode.json`, `agent-run.sh` and the Dockerfile differ.

- **Skills**: OpenCode reads Agent Skills, here from `.claude/skills` through `skills.paths`.
- **Model**: an `@ai-sdk/openai-compatible` provider pointed at `apify/openrouter` with the run token.
  The output limit is set to the proxy's 2,048 tokens per request.
- **Step limit**: the input's `maxSteps` goes to the `build` agent's `steps`. OpenCode has no cost limit.
- **Permissions**: in headless runs every "ask" becomes a rejection, so `opencode.json` sets every
  permission explicitly. Leaving `external_directory` at its default failed a platform run on 2026-10-23.
- **No allowlist hook**: unlike the Claude Code variant, it has no Actor allowlist hook. OpenCode
  plugins would add one, but they are JavaScript.

Verified on the platform on 2026-10-23: runs on two topics succeeded. The first used about $0.09 of LLM.
