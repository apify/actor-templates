# First, specify the base Docker image.
# You can see the Docker images from Apify at https://hub.docker.com/r/apify/.
# You can also use any other image from Docker Hub.
FROM apify/actor-python:3.14

# Copy uv binary from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

USER myuser

# Second, copy just pyproject.toml and uv.lock into the Actor image,
# since these should be the only files that affect the dependency install in the next step,
# in order to speed up the build.
COPY --chown=myuser:myuser pyproject.toml uv.lock ./

# Install the packages specified in pyproject.toml,
# Print the installed Python version, uv version
# and all installed packages with their versions for debugging
RUN echo "Python version:" \
 && python --version \
 && echo "uv version:" \
 && uv --version \
 && echo "Installing dependencies:" \
 && uv sync --frozen --no-dev --no-editable \
 && echo "All installed Python packages:" \
 && uv pip list

# Next, copy the remaining files and directories with the source code.
# Since we do this after installing the dependencies, quick build will be really fast
# for most source file changes.
COPY --chown=myuser:myuser . ./

# Use compileall to ensure the runnability of the Actor Python code.
RUN python -m compileall -q my_actor/

# Specify how to launch the source code of your Actor.
CMD ["uv", "run", "python", "-m", "my_actor"]
