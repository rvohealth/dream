import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/setup/beforeAll.ts', './spec/setup/hooks.ts'],
    fileParallelism: false,
    maxConcurrency: 1,
    maxWorkers: 1,
    minWorkers: 1,
    mockReset: true,
    // globals: {
    //   context: 'readonly',
    // },
    // ...
  },
})
