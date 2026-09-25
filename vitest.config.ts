import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    isolate: false,
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/publish/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      thresholds: { statements: 95, branches: 85, functions: 95, lines: 95 },
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
        '**/fixtures/**',
        'demos/**',
        '/tmp/**',
        '**/tmp/**',
      ],
      include: ['packages/yargs-file-commands/src/**/*.ts'],
    },
  },
});
