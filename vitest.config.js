import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      all: true,
      enabled: true,
      exclude: ['lib/constants.js'],
      include: ['index.js', 'lib/*.js', 'bin/*.js'],
      reporter: ['lcov', 'text']
    }
  }
});
