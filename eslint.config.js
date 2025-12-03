// @ts-check

import eslint from '@eslint/js'
import typescriptEslint from 'typescript-eslint'
import typescriptParser from '@typescript-eslint/parser'

const config = typescriptEslint.config(
  eslint.configs.recommended,
  typescriptEslint.configs.recommendedTypeChecked,

  {
    ignores: ['docs/**/*', 'test-app/types/**/*', '.npmrc', 'vite.config.ts', 'dist/**/*'],
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: './tsconfig.json' },
    },
  },

  {
    rules: {
      'no-console': 'error',
      'no-unexpected-multiline': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-this-alias': 'off',
    },
  }
)
export default config
