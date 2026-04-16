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
        Event: 'readonly',
        CustomEvent: 'readonly',
        MouseEvent: 'readonly',
        global: 'writable',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
