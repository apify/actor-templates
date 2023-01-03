.PHONY: clean create-venv setup run

VENV_PATH = .venv
PYTHON = $(or $(wildcard $(VENV_PATH)/bin/python), $(shell which python3))

clean:
	rm -rf $(VENV_PATH)

create-venv:
	$(PYTHON) -m venv $(VENV_PATH)

setup:
	$(PYTHON) -m pip install --no-cache-dir -r requirements.txt

run:
	$(PYTHON) -m src.main
