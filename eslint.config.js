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
  },

  // typescript is a devDependency (and an optional peer), so a production
  // install does not have it, and a package entry that reaches it through
  // static imports fails at import time. Only the type file builders import
  // it, and the rest of src loads them with a dynamic import() (see
  // loadTypeFileBuilders in src/dream/QueryDriver/Kysely.ts)
  {
    files: ['src/**/*.ts'],
    ignores: ['src/helpers/cli/AST*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'typescript',
              message: 'Only the type file builders (src/helpers/cli/AST*.ts) may import typescript.',
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              group: ['**/AST*'],
              caseSensitive: true,
              message: 'The type file builders import typescript; load them with a dynamic import().',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  }
)
export default config
