# Specify the base Docker image
FROM oven/bun:1.0

# Next, copy the source files using the user set
# in the base image.
COPY . ./

# Install all dependencies. 
RUN bun install

# Create and run as a non-root user.
RUN useradd --no-create-home apify && \
    chown -R apify:apify ./
USER apify

# Run the image.
CMD bun run start
