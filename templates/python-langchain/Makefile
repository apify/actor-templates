DIRS_WITH_CODE = src/ tests/

.PHONY: clean
clean:
	rm -rf .mypy_cache .pytest_cache .ruff_cache build dist

.PHONY: install-dev
install-dev:
	uv sync --frozen --all-groups

.PHONY: lint
lint:
	uv run ruff format --check $(DIRS_WITH_CODE)
	uv run ruff check --preview $(DIRS_WITH_CODE)

.PHONY: type-check
type-check:
	uv run mypy $(DIRS_WITH_CODE)

.PHONY: format
format:
	uv run ruff check --fix $(DIRS_WITH_CODE)
	uv run ruff format $(DIRS_WITH_CODE)

.PHONY: unit-test
unit-test:
	uv run --directory tests/ pytest

.PHONY: check
check: lint type-check unit-test
