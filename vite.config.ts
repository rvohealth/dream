import './test-app/app/conf/loadEnv.js'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/setup/beforeAll.js', './spec/setup/hooks.js'],
    fileParallelism: true,
    maxConcurrency: parseInt(process.env.DREAM_PARALLEL_TESTS || '1'),
    maxWorkers: parseInt(process.env.DREAM_PARALLEL_TESTS || '1'),
    minWorkers: 1,
    mockReset: true,
    // globals: {
    //   context: 'readonly',
    // },
    // ...
  },
})
