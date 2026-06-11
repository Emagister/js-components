# Changelog

## [1.11.0](https://github.com/Emagister/js-components/compare/v1.10.0...v1.11.0) (2026-06-11)


### Features

* **chunked-upload:** add ChunkedUpload component with Tus protocol support ([a21b7ac](https://github.com/Emagister/js-components/commit/a21b7acff6f2932afdb5a2282c33e95ea4b00e56))
* **chunked-upload:** add configurable button labels (selectFileButton, uploadFileButton, cancelButton) ([9c7c578](https://github.com/Emagister/js-components/commit/9c7c5782ffb66be96f7db27bf222e5208be95153))
* **chunked-upload:** add keyboard accessibility to dropzone ([d67a331](https://github.com/Emagister/js-components/commit/d67a331f6173acfe65100b91e6183bb5f0dc0303))
* **chunked-upload:** add labels.icon and labels.dropzoneSubtitle support ([2b2c611](https://github.com/Emagister/js-components/commit/2b2c6118c57644abe4b0d4a7605547c3bc247920))
* **chunked-upload:** add uploading overlay, auto-reset, and status labels ([945fb60](https://github.com/Emagister/js-components/commit/945fb608dd6d74d44536f8852b52732ac3cfac79))
* **chunked-upload:** expose uploadId in upload-success event detail ([0a4bdda](https://github.com/Emagister/js-components/commit/0a4bdda6c13b80588097757cb9f256ac4b0f2569))
* **chunked-upload:** make maxNumberOfFiles configurable and move auto-reset to complete ([f952621](https://github.com/Emagister/js-components/commit/f952621b276a3a069809608e49c7f1d9f6635afa))
* **data-table:** add tooltip support to column cell values ([fd9d406](https://github.com/Emagister/js-components/commit/fd9d406b391c996e0abbc255412ad9bd3d6e79d3))
* **rich-multi-select:** add clearInputOnSelect option ([37501df](https://github.com/Emagister/js-components/commit/37501df8fb776ee6fd8a62f206abdc80892fb911))
* **rich-multi-select:** add placeholderWithItems option ([17f955b](https://github.com/Emagister/js-components/commit/17f955bf2df0c233d437f8174c8150faa123084d))


### Bug Fixes

* **chunked-upload:** add bubbles:true to all CustomEvent dispatches ([ec581c8](https://github.com/Emagister/js-components/commit/ec581c8b549b6ab393a5128c264285d5c2d649b8))
* **chunked-upload:** clear file list DOM on cancel ([65dcbbd](https://github.com/Emagister/js-components/commit/65dcbbd824e7b6ef7372066434187dffb9ee706b))
* **chunked-upload:** dispatch cancel-all event from #reset() ([9c9ce79](https://github.com/Emagister/js-components/commit/9c9ce79df2b8fec5841101d5562c2945546bff22))
* **chunked-upload:** emit cancel-all only on explicit user cancellation ([6fb13cc](https://github.com/Emagister/js-components/commit/6fb13cc3ab177da0d17b996e31dc396f1da778b0))
* **chunked-upload:** guard formatBytes against undefined file size ([c0130e1](https://github.com/Emagister/js-components/commit/c0130e172a3b88f57b58ad5bcb25841b58b0a50d))
* **chunked-upload:** guard new URL() in upload-success against relative and invalid URLs ([8432f88](https://github.com/Emagister/js-components/commit/8432f888f832aba19adc499958884cca8ba6558b))
* **chunked-upload:** guard remove button against mid-upload removal ([f55319e](https://github.com/Emagister/js-components/commit/f55319e3a1da3c66e691ae3c82a3ca9f89d865b9))
* **chunked-upload:** prevent page scroll on Space key and clear auto-reset timer on cancel ([05e00d4](https://github.com/Emagister/js-components/commit/05e00d4ce7e2a411b8bef48a113d952caa45c7a6))
* **chunked-upload:** remove overlay on upload-error to prevent blocked dropzone ([2424056](https://github.com/Emagister/js-components/commit/2424056826da5bdc3eb6a0273d368ce9c5f83e6c))
* **chunked-upload:** replace hardcoded rgba background with color-mix CSS variable ([518a4dc](https://github.com/Emagister/js-components/commit/518a4dc2438847fbea9707b55030dadfc9be4316))
* **chunked-upload:** throttle upload-progress CustomEvent to animation frame ([2ac637b](https://github.com/Emagister/js-components/commit/2ac637b0e62c634b77d83ef3c80e69df4b747c78))
* **data-table:** add tabindex="0" to non-focusable tooltip elements ([8b01ea8](https://github.com/Emagister/js-components/commit/8b01ea84d3761103bdcacb7d58055c38b2d49b23))
* **data-table:** skip tooltip when row field is null or undefined ([ce4ac18](https://github.com/Emagister/js-components/commit/ce4ac1812f4c90b7801ca18ac1d9cc0ce2b374a9))
* **lint:** add location and KeyboardEvent browser globals to eslint config ([1c72dde](https://github.com/Emagister/js-components/commit/1c72dde520e92834044a981aa35f5d2342fc86ee))
* **lint:** add missing browser globals URL, File, DragEvent to eslint config ([32d9bdd](https://github.com/Emagister/js-components/commit/32d9bdd1b4a5a92dacb7e0df3e4cb3140519d0e9))
* **lint:** complete s→settings rename in RichMultiSelect and add rAF globals ([25e11d6](https://github.com/Emagister/js-components/commit/25e11d69dcb31a516b6799acded1c6c6531b55cd))
* **rich-multi-select:** apply placeholderWithItems on init when values are pre-selected ([de09b38](https://github.com/Emagister/js-components/commit/de09b386eb7b2f543af597f6a38f7c815c904f86))
* **rich-multi-select:** persist placeholderWithItems across TomSelect internal resets ([74faa2e](https://github.com/Emagister/js-components/commit/74faa2ea014833a055b26b3d5a4dc83346d37440))
* **rich-multi-select:** use != null guard for placeholderWithItems ([65b72b2](https://github.com/Emagister/js-components/commit/65b72b2ddf13faeff6b66858ee42b33e2641f634))


### Documentation

* **chunked-upload:** document uploadId field in upload-success event ([dc75412](https://github.com/Emagister/js-components/commit/dc754128d9c37b260e25978746b76eb98a93533f))
* **chunked-upload:** fix progress snippet and example chunk size label ([e9c5d68](https://github.com/Emagister/js-components/commit/e9c5d68e5407b9c5101e4107a9044b65d69ada57))


### Tests

* **rich-multi-select:** strengthen placeholderWithItems default test ([a0237b2](https://github.com/Emagister/js-components/commit/a0237b29c039718c85a421c2e110eef6eb30efa0))


### Code Refactoring

* **chunked-upload:** extract DEFAULT_SETTINGS constant to avoid duplication ([e4e7749](https://github.com/Emagister/js-components/commit/e4e7749f6f8a8ade828b7fa7e61dbe90f94df1fc))
* **chunked-upload:** replace innerHTML and querySelector with createElement ([9226604](https://github.com/Emagister/js-components/commit/9226604a224712f538b60591cbc2ae762ec8eee2))
* rename single-letter variables to descriptive names ([339b330](https://github.com/Emagister/js-components/commit/339b3304be9882d3070ac83b3e9135391cd0a202))
* replace generic variable names and magic numbers with descriptive identifiers ([9379e0d](https://github.com/Emagister/js-components/commit/9379e0dadb5c195607a36be7494336e77a9a08f7))




## [1.10.0](https://github.com/Emagister/js-components/compare/v1.9.0...v1.10.0) (2026-05-19)


### Features

* **data-table:** add activeOnDisabledRow option to keep an action interactive on disabled rows ([130faa7](https://github.com/Emagister/js-components/commit/130faa7e773e26778555d753ff62ff0fe61700eb))
* **data-table:** add disabledRow option to visually mute rows ([a1043c1](https://github.com/Emagister/js-components/commit/a1043c1706b317efc41632bc7037901228cefa2d))
* **data-table:** support negation prefix ! in disabledRow option ([dfc3dc7](https://github.com/Emagister/js-components/commit/dfc3dc70ba851648029309a6357f4d3758ea6fd7))
* **data-table:** three-state sort cycle (asc → desc → reset) ([739620e](https://github.com/Emagister/js-components/commit/739620ed9ffd92654adf97dbd28837b0d9f7bd54))


### Bug Fixes

* **data-table:** add aria-disabled and disable interactive elements on disabled rows ([d5670e2](https://github.com/Emagister/js-components/commit/d5670e2bdfccd12b478b1332bd5c82b2f2f41aa3))
* **data-table:** add aria-sort attribute for screen reader accessibility ([48c6738](https://github.com/Emagister/js-components/commit/48c6738fa092049a7215d47d9a45b76e8d087ee0))
* **data-table:** auto-apply data-table-container class on init ([082b5e2](https://github.com/Emagister/js-components/commit/082b5e28281c09448d9257464ed8b8e7173e3f68))


### Documentation

* **claude:** add guideline for responding to PR review comments with fix SHA ([f61c334](https://github.com/Emagister/js-components/commit/f61c33437955f54e12d360a62abd4cabfef17089))




## [1.9.0](https://github.com/Emagister/js-components/compare/v1.8.1...v1.9.0) (2026-05-15)


### Features

* **rich-multi-select:** add RichMultiSelect component ([d9b9645](https://github.com/Emagister/js-components/commit/d9b9645ab9f25a8d16fd14f39cc8bfdc557be949))


### Bug Fixes

* **rich-multi-select:** address PR review comments ([1b16cd7](https://github.com/Emagister/js-components/commit/1b16cd7afe677bd0ff7acf34cbd51f66e6219235))
* **rich-multi-select:** guard stale fetch after destroy and handle malformed settings ([497f042](https://github.com/Emagister/js-components/commit/497f042d100a4f4318d694069e265e5e51ad46fc))
* **rich-multi-select:** prevent stale fetch after destroy and fix hardcoded color ([8d624f2](https://github.com/Emagister/js-components/commit/8d624f2ca5151ec006ac478aa3f113b877c5cd84))
* **rich-multi-select:** remove border-color override to match Bootstrap form controls ([075e800](https://github.com/Emagister/js-components/commit/075e8004751e6963d967e9ed25b22c19b0da3b23))
* **rich-multi-select:** sync package-lock.json to match package.json ([0245cc9](https://github.com/Emagister/js-components/commit/0245cc95ac5d9350dee096892ee49ca58deab848))


### Styles

* **rich-multi-select:** add missing newline at end of SCSS file ([06603c0](https://github.com/Emagister/js-components/commit/06603c0b4344287f177ce373d7ce6b9e385db087))




### [1.8.1](https://github.com/Emagister/js-components/compare/v1.8.0...v1.8.1) (2026-05-06)


### Bug Fixes

* **component-manager:** address review comments on async init ([ed5d890](https://github.com/Emagister/js-components/commit/ed5d89059d8e9d53cb6d34d1b9dfd6d1e65d0c1f))
* **component-manager:** await all mounts before emitting emg-jsc:initialized ([dfeea29](https://github.com/Emagister/js-components/commit/dfeea2966cf817b2715eb134eaaf1b72291a9aae))




## [1.8.0](https://github.com/Emagister/js-components/compare/v1.7.0...v1.8.0) (2026-05-04)


### Features

* **datatable:** auto-include perPage value in pageSizeOptions if missing ([ccd8038](https://github.com/Emagister/js-components/commit/ccd8038a068696c8378dbf6f34982696dff78d14))


### Bug Fixes

* **datatable:** skip perPage auto-insert when pageSizeOptions is [] ([11e333f](https://github.com/Emagister/js-components/commit/11e333f9bd028176ee76134a0920d9f55eb46642))




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
