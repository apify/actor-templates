# Specify the base Docker image. You can read more about
# the available images at https://docs.apify.com/sdk/js/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node:24-slim AS builder

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser:myuser package*.json ./

# Install all dependencies. Don't audit to speed up the installation.
# Use npm ci when package-lock.json exists, for reproducible installs. Fall back to npm install without a lockfile.
RUN if [ -f package-lock.json ]; then npm ci --include=dev --audit=false; else npm install --include=dev --audit=false; fi

# Next, copy the source files using the user set
# in the base image.
# To get more build cache hits, copy only the files the Actor needs (e.g. `COPY src ./src`) instead of everything.
COPY --chown=myuser:myuser . ./

# Install all dependencies and build the project.
# Don't audit to speed up the installation.
RUN npm run build

# Create final image
FROM apify/actor-node:24-slim

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser:myuser package*.json ./

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

# Copy built JS files from builder image
COPY --from=builder --chown=myuser:myuser /usr/src/app/dist ./dist

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
# To get more build cache hits, copy only the files the Actor needs (e.g. `COPY src ./src`) instead of everything.
COPY --chown=myuser:myuser . ./

# Run the image.
CMD ["node", "dist/main.js"]
