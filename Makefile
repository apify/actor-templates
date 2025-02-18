# This is used by the Github Actions to run the static analysis.

.PHONY: clean install-dev lint type-check format check-code

clean:
	rm -rf .mypy_cache .pytest_cache .ruff_cache build dist htmlcov .coverage

install-dev:
	poetry install --all-extras

lint:
	poetry run ruff format --check
	poetry run ruff check

type-check:
	poetry run mypy

format:
	poetry run ruff check --fix
	poetry run ruff format

check-code: lint type-check
