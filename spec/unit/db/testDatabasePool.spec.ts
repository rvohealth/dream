import { normalizeTestDatabaseParallelism, testDatabasePoolSize } from '../../../src/db/testDatabasePool.js'
import DreamApp from '../../../src/dream-app/index.js'

describe('test database pool parallelism', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('DreamApp#parallelTests', () => {
    it('defaults to one worker in test env when not configured', () => {
      process.env.NODE_ENV = 'test'
      const dreamApp = new DreamApp()

      expect(dreamApp.parallelTests).toBe(1)
    })

    it('normalizes a missing DREAM_PARALLEL_TESTS value to one worker', () => {
      process.env.NODE_ENV = 'test'
      const dreamApp = new DreamApp()

      dreamApp.set('parallelTests', Number(undefined))

      expect(dreamApp.parallelTests).toBe(1)
    })

    it('accepts an explicit single-worker configuration', () => {
      process.env.NODE_ENV = 'test'
      const dreamApp = new DreamApp()

      dreamApp.set('parallelTests', 1)

      expect(dreamApp.parallelTests).toBe(1)
    })

    it('is only exposed in test env', () => {
      process.env.NODE_ENV = 'development'
      const dreamApp = new DreamApp({ parallelTests: 4 })

      expect(dreamApp.parallelTests).toBeUndefined()
    })
  })

  describe('normalizeTestDatabaseParallelism', () => {
    it('normalizes invalid values to the minimum safe worker count', () => {
      expect(normalizeTestDatabaseParallelism(undefined)).toBe(1)
      expect(normalizeTestDatabaseParallelism(Number.NaN)).toBe(1)
      expect(normalizeTestDatabaseParallelism(0)).toBe(1)
      expect(normalizeTestDatabaseParallelism(0.5)).toBe(1)
    })

    it('keeps positive integer worker counts', () => {
      expect(normalizeTestDatabaseParallelism(3)).toBe(3)
    })
  })

  describe('testDatabasePoolSize', () => {
    it('builds the minimum pool when parallelism is missing or invalid', () => {
      expect(testDatabasePoolSize(undefined)).toBe(4)
      expect(testDatabasePoolSize(Number.NaN)).toBe(4)
      expect(testDatabasePoolSize(0)).toBe(4)
      expect(testDatabasePoolSize(1)).toBe(4)
    })

    it('widens the pool for configured parallelism', () => {
      expect(testDatabasePoolSize(3)).toBe(8)
    })
  })
})
