# Specify the base Docker image. You can read more about
# the available images at https://sdk.apify.com/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node:16 AS prod-dependencies

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package*.json ./

# Install only prod dependencies. Don't audit to speed up the installation.
RUN npm install --omit=dev --omit=optional --audit=false

# Continue with the same image, which already has the NPM cache and production dependencies populated.
FROM prod-dependencies AS builder

# Install dev dependencies too. Don't audit to speed up the installation.
RUN npm install --include=dev --audit=false

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
COPY . ./

# Build the project
RUN npm run build

# Create final image
FROM apify/actor-node:16

# Copy the production dependencies from the first stage to the final image
COPY --from=prod-dependencies /usr/src/app/node_modules ./node_modules

# Print the dependency tree for debugging
RUN (npm list --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Copy built JS files from builder image
COPY --from=builder /usr/src/app/dist ./dist

# Next, copy the remaining files and directories with the source code
COPY . ./

# Set the image command
CMD npm run start:prod --silent
