# Specify the base Docker image. You can read more about
# the available images at https://docs.apify.com/sdk/js/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node:22

# Install system dependencies
RUN apk add --no-cache jq wget bash

# Install the Apify CLI
RUN npm --quiet set progress=false \
    && npm install -g apify-cli \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# TODO Install any other dependencies here

# Copy main.sh script and any other files
COPY . ./

# Run the image.
CMD ["/bin/bash", "main.sh"]
