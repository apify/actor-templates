# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository stores boilerplate templates for [Apify Actors](https://apify.com/actors). Templates are consumed by the Apify CLI (`apify create`) and Apify Console to bootstrap new Actor projects. The package is published as `@apify/actor-templates`.

## Development Commands

### Node.js (templates infrastructure, tests)

```bash
npm install                    # Install dependencies
npm run test                   # Run all tests (Jest)
npm run test-node-templates    # Test only Node.js templates
npm run test-python-templates  # Test only Python templates
npm run lint                   # Run ESLint
npm run lint:fix               # Run ESLint with auto-fix
npm run format                 # Format with Prettier
npm run format:check           # Check formatting
npm run build                  # Build template archives (copies AGENTS.md + creates zips)
```

### Python (template code quality)

```bash
poe install-dev     # Install dev dependencies with uv
poe lint            # Run ruff format --check && ruff check
poe format          # Run ruff check --fix && ruff format
poe type-check      # Run ty type checker on each Python template
poe check-code      # Run lint + type-check
poe clean           # Remove cache directories
```

## Architecture

### Template Structure

```
templates/
├── manifest.json           # Template metadata (IDs, descriptions, categories, archiveUrls)
├── python-*/               # Python templates (use python- prefix)
├── ts-*/                   # TypeScript templates (use ts- prefix)
├── js-*/                   # JavaScript templates (use js- prefix)
└── cli-start/              # CLI-based Actor template
```

Each template is a complete, standalone Apify Actor project with:
- `.actor/` - Actor configuration (actor.json, input_schema.json, output_schema.json)
- `src/` - Source code
- `Dockerfile` - Container build definition
- `AGENTS.md` - AI agent development instructions (auto-generated from agent-bases)

### AGENTS.md Management

AGENTS.md files are shared across templates by language prefix:
- `agent-bases/python.AGENTS.md` → all `python-*` templates
- `agent-bases/ts.AGENTS.md` → all `ts-*` templates
- `agent-bases/js.AGENTS.md` → all `js-*` templates

The build process (`npm run build`) copies these to individual templates before creating archives.

### Build Process

1. `scripts/copy-agents-md-to-templates.mts` - Copies AGENTS.md files from agent-bases to matching templates
2. `src/build_templates.js` - Creates deterministic zip archives in `dist/templates/`

Archives are automatically built and committed by GitHub Actions on merge to master.

### Wrappers

`wrappers/` contains wrapper templates (currently only `python-scrapy`) with their own `manifest.json`.

## Testing

Tests use Jest and run each template via the Apify CLI:
- `test/templates.test.js` - Template execution tests
- `test/manifest.test.js` - Manifest validation

Run a single test by pattern:
```bash
npm run test -- --testNamePattern="python-start"
```

## Code Style

### Python Templates
- Single quotes for strings (double quotes for docstrings)
- Line length: 120 characters
- Ruff with `select = ["ALL"]` and specific ignores
- Type checking with ty (Python 3.10 target)

### Node.js/TypeScript Templates
- ESLint with `@apify/eslint-config`
- Prettier for formatting
- ES modules (`"type": "module"`)

## Adding/Modifying Templates

1. Create/modify template in `templates/<prefix>-<name>/`
2. Update `templates/manifest.json` with template metadata
3. For new language prefixes, add corresponding `agent-bases/<prefix>.AGENTS.md`
4. Run tests: `npm run test-templates -- --testNamePattern="<template-name>"`
5. Archives are built automatically on merge to master
