# This is used by the Github Actions to run the static analysis.

.PHONY: clean install-dev lint type-check format check-code

clean:
	rm -rf .mypy_cache .pytest_cache .ruff_cache build dist htmlcov .coverage

install-dev:
	uv sync --all-extras

lint:
	uv run ruff format --check
	uv run ruff check

# Due to each template having its own "src" directory, running type checking on all templates together causes
# the error: "Duplicate module named 'src'". Therefore, type checking must be executed separately for each template.
type-check:
	uv run mypy templates/python-beautifulsoup
	uv run mypy templates/python-crawlee-beautifulsoup
	uv run mypy templates/python-crawlee-playwright
	uv run mypy templates/python-empty
	uv run mypy templates/python-playwright
	uv run mypy templates/python-scrapy
	uv run mypy templates/python-selenium
	uv run mypy templates/python-standby
	uv run mypy templates/python-start
	uv run mypy templates/python-crewai
	uv run mypy templates/python-langgraph
	uv run mypy templates/python-llamaindex-agent

format:
	uv run ruff check --fix
	uv run ruff format

check-code: lint type-check
