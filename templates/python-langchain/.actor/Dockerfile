FROM apify/actor-python:3.13

WORKDIR /usr/src/app

COPY pyproject.toml uv.lock ./

RUN echo "Python version:" \
    && python --version \
    && echo "Pip version:" \
    && pip --version \
    && echo "Installing uv:" \
    && pip install --no-cache-dir uv \
    && echo "Installing dependencies:" \
    && uv sync --frozen --no-dev \
    && echo "All installed Python packages:" \
    && uv pip freeze

COPY src ./src

# create non-root user
RUN useradd -m apify && \
    chown -R apify:apify /usr/src/app

USER apify

CMD ["uv", "run", "--no-dev", "--frozen", "python3", "-m", "src"]
