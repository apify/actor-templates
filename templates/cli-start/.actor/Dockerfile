# Specify the base Docker image. You can read more about
# the available images at https://docs.apify.com/sdk/js/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node:22

# Install system dependencies
RUN apk add --no-cache jq wget bash curl && \
    curl --silent --location \
        https://raw.githubusercontent.com/houseabsolute/ubi/master/bootstrap/bootstrap-ubi.sh | sh

# Install the Apify CLI
RUN npm --quiet set progress=false \
    && npm install --global apify-cli \
    && echo "Globally installed NPM packages:" \
    && (npm list --global --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && npm cache clean --force

# TODO Install any other dependencies here - you may use `ubi` for that:
# RUN ubi \
#     --verbose \
#     --project https://github.com/someuser/repository \
#     --in /usr/local/bin

# Copy main.sh script and any other files
COPY . ./

# Run the image.
CMD ["/bin/bash", "main.sh"]
