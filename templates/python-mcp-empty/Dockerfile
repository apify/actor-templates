# First, specify the base Docker image.
# You can see the Docker images from Apify at https://hub.docker.com/r/apify/.
# You can also use any other image from Docker Hub.
FROM apify/actor-python:3.14

USER myuser

# Second, copy just requirements.txt into the Actor image,
# since it should be the only file that affects the dependency installation in the next step,
# in order to speed up the build.
COPY --chown=myuser:myuser requirements.txt ./

# Install the packages specified in requirements.txt,
# print the installed Python version, pip version,
# and all installed packages with their versions for debugging.
RUN echo "Python version:" \
 && python --version \
 && echo "Pip version:" \
 && pip --version \
 && echo "Installing dependencies:" \
 && pip install -r requirements.txt \
 && echo "All installed Python packages:" \
 && pip freeze

# Next, copy the remaining files and directories with the source code.
# Since we do this after installing the dependencies, quick builds will be really fast
# for most source file changes.
COPY --chown=myuser:myuser . ./

# Use compileall to ensure the runnability of the Actor Python code.
RUN python -m compileall -q my_actor/

# Make FastMCP refuse the long-lived `subscriptions/listen` stream of the 2026-07-28 MCP protocol.
# An open stream can keep a run alive after the client is gone, and you pay for the idle run.
ENV FASTMCP_ENABLE_SUBSCRIPTIONS_LISTEN=false

# Specify how to launch the source code of your Actor.
CMD ["python", "-m", "my_actor"]
