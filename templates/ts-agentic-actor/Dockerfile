# In the proposal this whole file becomes `FROM apify/actor-agent:1` plus `COPY agent/ .actor/ ./`:
# the base image carries the runtime (src/), Node, Python and common data libraries.
FROM apify/actor-node:24

# Skill scripts run inside the run's container, so the image needs their interpreters.
# The base image's preinstalled node_modules are not owned by myuser, so hand the app dir over too.
USER root
RUN apk add --no-cache python3 && chown -R myuser:myuser /usr/src/app
USER myuser

COPY --chown=myuser:myuser package*.json ./
RUN npm install --omit=dev --omit=optional --audit=false && rm -rf ~/.npm

COPY --chown=myuser:myuser . ./

# Node 24 runs TypeScript directly (type stripping), as apify-ai-agent does.
CMD ["node", "src/main.ts"]
