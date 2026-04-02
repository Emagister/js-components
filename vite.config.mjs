import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/styles/**', 'src/index.js'],
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'JsComponents',
      // The proper extensions will be added
      fileName: 'js-components',
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['bootstrap', 'flatpickr'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          bootstrap: 'bootstrap',
          flatpickr: 'flatpickr'
        },
      },
    },
  },
});
