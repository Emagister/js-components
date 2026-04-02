# Changelog

## [1.1.0](https://github.com/Emagister/js-components/compare/v1.0.2...v1.1.0) (2026-04-02)


### Features

* reorganize scss, improve datatable and update docs for npm publish ([c9ba747](https://github.com/Emagister/js-components/commit/c9ba7470189d4ce1317ea7eee6a5076a29886087))
* **tests:** add Vitest test suite with happy-dom ([4c4e90f](https://github.com/Emagister/js-components/commit/4c4e90f411d7fef439f76545803b8b3509d1313e))


### Bug Fixes

* address PR review comments from Copilot ([6819c6e](https://github.com/Emagister/js-components/commit/6819c6e344a1760cd0ade07eb709fdb9bb3a03a7))
* **lint:** resolve ESLint errors blocking CI ([ad3e471](https://github.com/Emagister/js-components/commit/ad3e471d53733cee25bc11ddd0e081b1147844b7))
* address PR [#2](https://github.com/Emagister/js-components/issues/2) review comments from Copilot ([aead0a9](https://github.com/Emagister/js-components/commit/aead0a9cab8faf8c45e6b50f585fe7bf62a07c67))


### Documentation

* **CLAUDE.md:** fix test directory path src/__tests__ → tests/ ([290fdf7](https://github.com/Emagister/js-components/commit/290fdf797af79598ac03ccc0e1d1c84739827ba4))


### Code Refactoring

* **components:** restore #destroy() as private, expose via DOM API ([5235819](https://github.com/Emagister/js-components/commit/52358192772289c4e84fb90aaeb07bc7d99cded0))
* **test:** remove globals:true in favor of explicit vitest imports ([42c6dee](https://github.com/Emagister/js-components/commit/42c6deed44c3a8980e626645756448f3e73dcfcb))


### Tests

* **DataTable:** add Vitest test suite for DataTable and DataTableTemplate ([b9bf60a](https://github.com/Emagister/js-components/commit/b9bf60a8af616b0ef785ad065609f6fb5603fb02))


### Continuous Integration

* **lint:** extend lint to tests/ and add Vitest + DOM globals to ESLint ([f7df22a](https://github.com/Emagister/js-components/commit/f7df22a33b7e21d306a13c38929af0a58b05b95f))
* **publish:** use GitHub App token to bypass main branch ruleset ([e40ce72](https://github.com/Emagister/js-components/commit/e40ce72601c0fa7158c2f1bb9df323e71effe7b8))
* **release:** consolidate release workflow into manual publish ([37a4ea0](https://github.com/Emagister/js-components/commit/37a4ea0932c34784aa1b4d087d50131c44a7d821))
* add ESLint and CI workflow for pull requests ([87f150e](https://github.com/Emagister/js-components/commit/87f150e4f5386fd4c0746768499b43e6919eb8f9))




### [1.0.2](https://github.com/Emagister/js-components/compare/v1.0.1...v1.0.2) (2026-03-31)


### Continuous Integration

* **release:** add npm publish via trusted publishing ([e56e0f2](https://github.com/Emagister/js-components/commit/e56e0f22a38b4775f688ca71c43eb1cdf51db5f2))




### [1.0.1](https://github.com/Emagister/js-components/compare/v1.0.0...v1.0.1) (2026-03-31)


### Continuous Integration

* **release:** generate and update CHANGELOG.md on each release ([956ed14](https://github.com/Emagister/js-components/commit/956ed141acd0c7f56a04dea3534202afa592d910))
