FROM apify/actor-node-playwright:24-1.64.1

COPY --chown=myuser:myuser package*.json Dockerfile ./

# Check Playwright version is the same as the one from base image.
RUN node check-playwright-version.mjs

# Use npm ci when package-lock.json exists, for reproducible installs. Fall back to npm install without a lockfile.
# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN npm --quiet set progress=false \
    && if [ -f package-lock.json ]; then npm ci --omit=dev --omit=optional; else npm install --omit=dev --omit=optional; fi \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
# To get more build cache hits, copy only the files the Actor needs (e.g. `COPY src ./src`) instead of everything.
COPY --chown=myuser:myuser . ./

# Run the image.
CMD ["node", "dist/main.js"]
