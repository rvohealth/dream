/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
  },
  testEnvironment: 'node',
  setupFiles: ['jest-plugin-context/setup'],
  setupFilesAfterEnv: ['<rootDir>spec/setup/globals.ts', '<rootDir>spec/setup/hooks.ts'],
  globalSetup: '<rootDir>spec/setup/beforeAll.ts',
  globalTeardown: '<rootDir>spec/setup/afterAll.ts',
}
