# Specify the base Docker image. You can read more about
# the available images at https://hub.docker.com/_/rust
FROM rust:1-slim-trixie AS builder
WORKDIR /usr/src/app

# Copy just Cargo.toml and Cargo.lock and build the dependencies first,
# to speed up the build using Docker layer cache.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs \
    && cargo build --release --locked \
    && rm -rf src

# Next, copy the source files and build the Actor. Touch main.rs,
# so that cargo rebuilds the crate instead of keeping the placeholder.
COPY src ./src
RUN touch src/main.rs && cargo build --release --locked

# Create final image.
# We use `debian:trixie-slim` because it is the base of the Apify Python and Node.js images, so it is often cached on the platform.
FROM debian:trixie-slim

# Install root certificates for HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user.
RUN useradd --create-home myuser
USER myuser
WORKDIR /home/myuser

# Copy the built binary from builder image
COPY --from=builder /usr/src/app/target/release/crawlee-html-rust /usr/local/bin/crawlee-html-rust

# Run the image.
CMD ["crawlee-html-rust"]
