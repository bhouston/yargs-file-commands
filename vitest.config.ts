import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    isolate: false,
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules',
        '**/coverage',
        '**/scripts',
        '**/dist',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test',
        '**/tests',
        '**/*.d.ts',
        '**/vitest.config.ts',
        '**/vitest.config.js',
        '**/fixtures',
        'demos/**',
      ],
      include: [
        'packages/yargs-file-commands/**',
      ]
    }
  },
  
});

