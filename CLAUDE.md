# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node.js is not installed on the host machine. All `npm`/`npx`/`node` commands must be run via Docker:

```bash
docker run --rm -v $(pwd):/app -w /app node:lts npm run dev
docker run --rm -v $(pwd):/app -w /app node:lts npm run build
docker run --rm -v $(pwd):/app -w /app node:lts npm run test
docker run --rm -v $(pwd):/app -w /app node:lts npm run test -- --reporter=verbose
docker run --rm -v $(pwd):/app -w /app node:lts npm run coverage
```

Available scripts: `dev` (dev server), `build` (ESM + UMD + CSS to dist/), `preview`, `lint`, `test`, `test:watch`, `coverage`.

Vitest, happy-dom, and @vitest/coverage-v8 are already in devDependencies. The test config lives in `vite.config.mjs` under the `test` key. Tests go in `tests/`.

## Architecture

### Core Pattern: Lazy-loaded Component System

The library's central concept is automatic DOM scanning and lazy loading:

1. **`ComponentRegistry`** (`src/ComponentRegistry.js`) — maps string names (e.g. `'data-table'`) to dynamic `import()` functions. Adding a new component = adding one entry here.

2. **`ComponentManager`** (`src/ComponentManager.js`) — on `start()`, scans the DOM for `[data-component~="name"]` attributes, resolves them via the registry, and instantiates the class. Uses `MutationObserver` to handle elements added after init. Also listens for `component:scan` custom events on any element to re-scan its subtree.

3. **`Component`** (`src/components/Component.js`) — abstract base class. All components extend it. Enforces `init()` implementation. Sets `this.root` to the DOM element.

### Component Conventions

- Each component lives in `src/components/<Name>/<Name>.js` with its own `_<name>.scss`.
- `init()` always: (a) sets `this.root.<componentName> = { publicAPI }` on the element, (b) dispatches a `<name>:initialized` CustomEvent on `this.root`.
- External code interacts with components via the DOM property (e.g. `el.loader.show()`), not by holding a reference to the class instance.
- Bootstrap components (`Modal`, `Tooltip`, `Dropdown`) wrap Bootstrap 5 classes. Flatpickr wraps `DatePicker`. Both are **peer dependencies** — not bundled.

### Styles

- `src/styles/variables.scss` — all SASS variables use `!default` so consumers can override with `@use ... with (...)`.
- The build outputs a single `dist/js-components.css`. Consumers can alternatively import `@emagister/js-components/scss/index` directly to customize at compile time.

### Distribution

- `dist/` is in `.gitignore` but included in npm via the `"files"` field in `package.json`. **Never reference this package via a git URL** — the dist won't be present.
- The package exposes both ESM (`dist/js-components.js`) and UMD (`dist/js-components.umd.cjs`), plus SCSS source via `./scss/*` export.

## Development Guidelines

### Test-Driven Development (TDD)

All new features must be implemented following the TDD red-green-refactor cycle:

1. **Red** — write a failing test that defines the expected behavior.
2. **Green** — write the minimum code needed to make the test pass.
3. **Refactor** — clean up the implementation without breaking the tests.

Tests go in `tests/` mirroring the `src/` structure. Run tests via Docker as shown above.

## Release Process

Releases are manual: trigger the `publish` workflow via GitHub Actions `workflow_dispatch`. It auto-bumps the version (semver from commit messages), updates `CHANGELOG.md`, tags, creates a GitHub Release, and publishes to npm. Requires `BOT_APP_ID` and `BOT_PRIVATE_KEY` secrets (GitHub App) to bypass the main branch ruleset.
