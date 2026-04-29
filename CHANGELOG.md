# Changelog

## [1.7.0](https://github.com/Emagister/js-components/compare/v1.6.0...v1.7.0) (2026-04-29)


### Features

* **datatable:** emit auth events on 401 and redirect responses ([86865ee](https://github.com/Emagister/js-components/commit/86865eed9919605a648aee6b56eee03afc36654b))




## [1.6.0](https://github.com/Emagister/js-components/compare/v1.5.2...v1.6.0) (2026-04-28)


### Features

* **datatable:** añadir opción fetchOnInit para diferir la carga inicial de datos ([e499530](https://github.com/Emagister/js-components/commit/e499530d27d6ebb8979e3b4cdf2642eae5355852))


### Tests

* **datatable:** improve assertions in fetchOnInit tests based on Copilot review ([ab43827](https://github.com/Emagister/js-components/commit/ab43827437b0a2c925e8412a8bfdb1a36c7f654e))




### [1.5.2](https://github.com/Emagister/js-components/compare/v1.5.1...v1.5.2) (2026-04-27)


### Bug Fixes

* **datatable:** redirigir a última página válida cuando la página actual queda fuera de rango tras recargar ([61fd737](https://github.com/Emagister/js-components/commit/61fd73717397d572135ca37e3e74bf5756c93bc1))


### Tests

* **datatable:** corregir fixture y aserción duplicada en tests de corrección de página ([9c0e75b](https://github.com/Emagister/js-components/commit/9c0e75b6c5213b6234f6114eb6c04549c5ff7366))


### Code Refactoring

* **datatable:** eliminar doble setState y mutación directa de estado en tests ([3750a8b](https://github.com/Emagister/js-components/commit/3750a8bc8bd22eabbf117f1d2e9000b58f892f75))




### [1.5.1](https://github.com/Emagister/js-components/compare/v1.5.0...v1.5.1) (2026-04-22)


### Bug Fixes

* **ci:** tag release commit instead of merge commit ([7d62218](https://github.com/Emagister/js-components/commit/7d622180171a319cd7143d739b5502cfe542fba7))




## [1.5.0](https://github.com/Emagister/js-components/compare/v1.4.0...v1.5.0) (2026-04-20)


### Features

* **rich-text-editor:** add RichTextEditor component based on TipTap v3 ([89adcbd](https://github.com/Emagister/js-components/commit/89adcbd3a4ece30d8da6cf16c33628a77e2d9449))


### Bug Fixes

* **rich-text-editor:** address PR review comments ([5f903db](https://github.com/Emagister/js-components/commit/5f903dbcf58f81b32da9765cf00bd6ca8020eea9))
* **rich-text-editor:** remove placeholder from examples and README ([ce24bc5](https://github.com/Emagister/js-components/commit/ce24bc56f74c56b1b5f6f3d6a4b909e238350f3f))


### Code Refactoring

* **rich-text-editor:** use StarterKit built-in Link mark (TipTap v3) ([bc0f465](https://github.com/Emagister/js-components/commit/bc0f46520b53444d4375f4f47e620b5d16987d3b))




## [1.4.0](https://github.com/Emagister/js-components/compare/v1.3.0...v1.4.0) (2026-04-16)


### Features

* **data-table:** add actionsWidth setting to control actions column width ([ecdef12](https://github.com/Emagister/js-components/commit/ecdef12b5184dac7507e8186b652af09c9af2ada))
* **data-table:** add filterForm object config with resetButtonId support ([3f53b8a](https://github.com/Emagister/js-components/commit/3f53b8aba19bb66e3d674794087c7822da867c10))
* **data-table:** add page size selector with i18n and layout redesign ([84c7532](https://github.com/Emagister/js-components/commit/84c7532245bc81976f7eb05ac60b46d82816e263))


### Bug Fixes

* **data-table:** address PR review comments on filterForm reset button ([ed97322](https://github.com/Emagister/js-components/commit/ed97322dada6ae02516140c5a9b55364e3cccc1a))
* **data-table:** scroll to table top when changing page size ([fb3b29a](https://github.com/Emagister/js-components/commit/fb3b29a8c5c062740663ea5dd90e00016662dce4))
* **data-table:** validate perPage input and fix label accessibility ([cd378c3](https://github.com/Emagister/js-components/commit/cd378c3d26516920eb31bf8ec45efc6c2df1e1e6))
* **lint:** add MouseEvent to eslint globals for test environment ([4d0cff3](https://github.com/Emagister/js-components/commit/4d0cff35fedf904104427c77afc6c9bd624ee563))




## [1.3.0](https://github.com/Emagister/js-components/compare/v1.2.0...v1.3.0) (2026-04-14)


### Features

* **data-table:** add column width support via colgroup ([00f98c2](https://github.com/Emagister/js-components/commit/00f98c224f59525334945a796c5a9d5e429e1d06))
* **data-table:** add optional bulk delete functionality ([3d20594](https://github.com/Emagister/js-components/commit/3d205948cfda8d9067243b1866b33c49b59fca72))
* **data-table:** add results counter and i18n labels support ([9014642](https://github.com/Emagister/js-components/commit/9014642f79f99a5799db05a00a8e4a96a5282772))




## [1.2.0](https://github.com/Emagister/js-components/compare/v1.1.1...v1.2.0) (2026-04-02)


### Features

* rename all custom events to use emg-jsc: prefix ([8f46f12](https://github.com/Emagister/js-components/commit/8f46f12231bc65d136fe7d1c44f601ba75a4ddc2))


### Tests

* fix component:scan event test and update test descriptions ([2e761e4](https://github.com/Emagister/js-components/commit/2e761e48f54d4d721e6c0c4e6a13f3d7f9f5a02b))




### [1.1.1](https://github.com/Emagister/js-components/compare/v1.1.0...v1.1.1) (2026-04-02)


### Bug Fixes

* **async-form:** use Bootstrap native invalid-feedback class for field errors ([1a9e9f5](https://github.com/Emagister/js-components/commit/1a9e9f5144b1ff8dd42ffcf0f5551abd714f1504))


### Reverts

* Revert "ci: add npm auth debug step" ([b4adcb8](https://github.com/Emagister/js-components/commit/b4adcb8569e073b9181259cf6679fbfa15f189fb))


### Continuous Integration

* fix changelog interpolation breaking shell script ([1347b14](https://github.com/Emagister/js-components/commit/1347b14ae39abda611756ba4193227f0da3db434))




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
