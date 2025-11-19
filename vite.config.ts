import './test-app/app/conf/loadEnv.js'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./spec/setup/beforeAll.js', './spec/setup/hooks.js'],
    fileParallelism: true,
    maxConcurrency: parseInt(process.env.DREAM_PARALLEL_TESTS || '1'),
    maxWorkers: parseInt(process.env.DREAM_PARALLEL_TESTS || '1'),
    mockReset: true,

    watch: false,
    clearMocks: true,
    restoreMocks: true,
    printConsoleTrace: true,
  },
})
