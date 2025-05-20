FROM node:22-alpine AS builder

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package*.json ./

# Install all dependencies. Don't audit to speed up the installation.
RUN npm install --include=dev --audit=false

# Next, copy the source files using the user set
# in the base image.
COPY . ./

# Install all dependencies and build the project.
# Don't audit to speed up the installation.
RUN npm run build

# Create final image
FROM node:22-alpine

# Install uv
RUN apk add py3-uv

# Create and run as a non-root user.
RUN adduser -h /home/apify -D apify
# Create app directory
RUN mkdir -p /home/apify/app
WORKDIR /home/apify/app

# Copy built JS files from builder image
COPY --from=builder /dist ./dist

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package*.json ./
RUN chown -R apify:apify /home/apify/app
USER apify

# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# Install the MCP server
# TODO: Install the MCP server you are actually using
RUN uv tool install arxiv-mcp-server

# Tell Node.js this is a production environment
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (Actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# Run the image.
#CMD ["npm", "run", "start:prod", "--silent"]
CMD ["node", "dist/main.js", "--silent"]
