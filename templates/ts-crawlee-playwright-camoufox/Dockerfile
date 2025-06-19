# Specify the base Docker image. You can read more about
# the available images at https://crawlee.dev/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node-playwright-camoufox:22-1.53.1 AS builder

# Check preinstalled packages
RUN npm ls crawlee apify puppeteer playwright

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser package*.json Dockerfile ./

# Check Playwright version is the same as the one from base image.
RUN node check-playwright-version.mjs

# Install all dependencies. Don't audit to speed up the installation.
RUN npm install --include=dev --audit=false

# Next, copy the source files using the user set
# in the base image.
COPY --chown=myuser . ./

# Install all dependencies and build the project.
# Don't audit to speed up the installation.
RUN npm run build

# Create final image
FROM apify/actor-node-playwright-camoufox:22-1.53.1

# Check preinstalled packages
RUN npm ls crawlee apify puppeteer playwright

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser package*.json ./

# Install NPM packages, skip development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN npm --quiet set progress=false \
    && npm install --omit=dev \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# Copy built JS files from builder image
COPY --from=builder --chown=myuser /home/myuser/dist ./dist

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
COPY --chown=myuser . ./


# Run the image. If you know you won't need headful browsers,
# you can remove the XVFB start script for a micro perf gain.
CMD ./start_xvfb_and_run_cmd.sh && npm run start:prod --silent
