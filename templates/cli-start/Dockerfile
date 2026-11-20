# mise (https://mise.jdx.dev) installs the tools listed in mise.toml.
# The image is pinned by digest; Renovate updates the tag and digest together.
FROM jdxcode/mise:2026.11.10@sha256:80aa2afb17ba760cabe74ac90771ca2d1470773d514cc2bb79c69c8d3f92f150 AS mise

# Specify the base Docker image. Any image works; Apify CLI and the other tools come from mise.toml.
FROM alpine:3.23@sha256:469c9ea410b9215eaee7976ba6c0639039b444be8e5d638f7abbada189971eb2

# Install system dependencies
# libstdc++ and libgcc are needed by the standalone Apify CLI binary
RUN apk add --no-cache jq bash libstdc++ libgcc

WORKDIR /usr/src/app

# Install the tools listed in mise.toml. Add a tool with e.g. `mise use github:someuser/repository@1.2.3`;
# mise verifies release checksums and GitHub attestations where available.
COPY --from=mise /usr/local/bin/mise /usr/local/bin/mise
ENV MISE_DATA_DIR=/opt/mise MISE_TRUSTED_CONFIG_PATHS=/usr/src/app PATH="/opt/mise/shims:$PATH"
COPY mise.toml /etc/mise/config.toml
RUN mise install && rm -rf /root/.cache/mise

# Copy main.sh script and any other files
COPY . ./

# Run the image.
CMD ["/bin/bash", "main.sh"]
