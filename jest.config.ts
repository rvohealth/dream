import { pathsToModuleNameMapper } from 'ts-jest/utils'
import { compilerOptions } from './tsconfig.json'

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
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  transform: {},
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),

  // transform: {
  //   '^.+\\.(ts|tsx)$': [
  //     'ts-jest',
  //     {
  //       tsConfig: 'tsconfig.json',
  //     },
  //   ],
  // },
}
