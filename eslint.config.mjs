import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        Node: 'readonly',
        MutationObserver: 'readonly',
        CustomEvent: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        clearTimeout: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        global: 'writable',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
