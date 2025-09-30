# Specify the base Docker image
FROM oven/bun:1.2

# Next, copy the source files using the user set
# in the base image.
COPY --chown=myuser:myuser . ./

# Install all dependencies.
RUN bun install

# Run the image.
CMD bun run start
