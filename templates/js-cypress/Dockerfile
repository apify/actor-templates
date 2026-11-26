FROM cypress/browsers:node-26.13.1-chrome-158.0.8127.88-1-ff-161.0-edge-158.0.4370.33-1
# cypress image entrypoint runs the tests right away
# we want to run our own CMD
ENTRYPOINT [""]

COPY package*.json ./

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
COPY . ./

# Run the image.
CMD ["node", "src/main.js"]
