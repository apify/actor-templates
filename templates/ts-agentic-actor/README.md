# Agentic Actor (TypeScript runtime)

An Actor that runs an AI agent over a packaged procedure instead of fixed code. The Actor-specific part
is only content:

```text
agent/
  AGENT.md              main prompt: goal, procedure, output contract, what to do when things go wrong
  agent.json            model, limits (steps, budget, per-child-run cap), Actor allowlist
  skills/<name>/        Agent Skills (SKILL.md + scripts/), e.g. tested Actor inputs, a scoring script
.actor/                 input, dataset and output schemas, as in any Actor
```

`src/` is the generic runtime (in the proposal it moves to a base image):

- **Agent**: Mastra `Agent` with a `Workspace`: local filesystem, local command execution and
  Agent Skills discovery over `agent/skills`.
- **Model**: billed to the user who runs the Actor, through `apify/openrouter` and the run token.
- **`run_actor`**: runs an allowlisted Actor with `maxTotalChargeUsd` and saves its items to
  `data/raw/<name>.json`, so data stays out of the model's context.
- **`push_dataset_items`, `save_record`, `finish`**: output tools. Items are validated against
  `.actor/dataset_schema.json`.
- **Budget**: one budget for LLM tokens plus child runs, stopped by the runtime. A child run is
  capped at half of what is left, never below the child's `minimalMaxTotalChargeUsd`.
- **Scripts**: commands run without the host environment, so a script never sees `APIFY_TOKEN`.
- **Trace**: `AGENT_TRACE.json` in the run's key-value store.

The example package finds and scores influencers who post about a topic on Instagram, TikTok and YouTube.

```bash
npm install
npm test          # end-to-end runs with a scripted model and a fake platform; no LLM, no cost
apify push        # deploy; then run it from Console
```

Verified on the platform on 2026-10-23: runs on two topics succeeded, at about $0.31 of LLM plus
$0.18–0.26 of child Actor runs each.
