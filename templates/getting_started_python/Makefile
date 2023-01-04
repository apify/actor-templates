.PHONY: clean create-venv setup run actor-post-create actor-run

VENV_PATH = .venv
PYTHON = $(or $(wildcard $(VENV_PATH)/bin/python), $(shell which python3))

clean:
	rm -rf $(VENV_PATH)

# We need to reevaluate the PYTHON variable here after we create a virtual environment,
# because we should use the Python executable from the virtual environment from now on
create-venv:
	$(PYTHON) -m venv $(VENV_PATH)
	$(eval PYTHON=$(VENV_PATH)/bin/python3)

setup:
	$(PYTHON) -m pip install --no-cache-dir -r requirements.txt

run:
	$(PYTHON) -m src.main

actor-post-create: create-venv setup

actor-run: run
