/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  clearMocks: true,
  extensionsToTreatAsEsm: ['.ts'],
  globalSetup: '<rootDir>spec/setup/beforeAll.ts',
  globalTeardown: '<rootDir>spec/setup/afterAll.ts',
  preset: 'ts-jest',
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ['jest-plugin-context/setup'],
  setupFilesAfterEnv: ['<rootDir>spec/setup/hooks.ts', 'luxon-jest-matchers'],
  testEnvironment: 'node',
  transform: {},
}
