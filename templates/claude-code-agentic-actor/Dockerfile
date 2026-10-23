# Harness-only agentic Actor: no Actor-specific code. The image installs a ready-made headless agent
# (Claude Code) and the Apify CLI for input/output; the Actor itself is CLAUDE.md + .claude/.
# In the proposal everything up to the COPY lives in a base image, e.g. apify/actor-agent-claude-code.
FROM apify/actor-node:24

USER root
RUN apk add --no-cache python3 jq bash curl \
    && npm install -g @anthropic-ai/claude-code@2.1.309 apify-cli@1.10.0 \
    && chown -R myuser:myuser /usr/src/app
USER myuser

COPY --chown=myuser:myuser . ./

CMD ["sh", "agent-run.sh"]
