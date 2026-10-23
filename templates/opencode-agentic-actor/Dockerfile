# Harness-only agentic Actor on OpenCode (MIT). Same package as the Claude Code variant.
FROM apify/actor-node:24

USER root
RUN apk add --no-cache python3 jq bash curl ripgrep \
    && npm install -g opencode-ai@1.19.4 apify-cli@1.10.0 \
    && chown -R myuser:myuser /usr/src/app
USER myuser

COPY --chown=myuser:myuser . ./

CMD ["sh", "agent-run.sh"]
