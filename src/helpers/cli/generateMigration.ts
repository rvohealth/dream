import fs from 'fs/promises'
import path from 'path'
import pluralize from 'pluralize'
import generateMigrationContent from '../cli/generateMigrationContent'
import primaryKeyType from '../db/primaryKeyType'
import hyphenize from '../hyphenize'
import migrationVersion from '../migrationVersion'
import pascalizePath from '../pascalizePath'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths'
import dreamPath from '../path/dreamPath'
import snakeify from '../snakeify'
import generateStiMigrationContent from './generateStiMigrationContent'

export default async function generateMigration(
  migrationName: string,
  columnsWithTypes: string[],
  fullyQualifiedModelName?: string,
  parentName?: string
) {
  const { relFilePath, absFilePath } = dreamFileAndDirPaths(
    path.join(dreamPath('db'), 'migrations'),
    `${migrationVersion()}-${hyphenize(migrationName).replace(/\//g, '-')}.ts`
  )

  const isSTI = !!parentName
  let finalContent: string = ''

  if (isSTI) {
    finalContent = generateStiMigrationContent({
      table: snakeify(pluralize(pascalizePath(parentName))),
      columnsWithTypes,
      primaryKeyType: primaryKeyType(),
    })
  } else if (fullyQualifiedModelName) {
    finalContent = generateMigrationContent({
      table: snakeify(pluralize(pascalizePath(fullyQualifiedModelName))),
      columnsWithTypes,
      primaryKeyType: primaryKeyType(),
    })
  } else {
    const tableName: string | undefined = migrationName.match(/-to-(.+)$/)?.[1]
    finalContent = generateMigrationContent({
      table: tableName ? pluralize(tableName) : '<table-name>',
      columnsWithTypes,
      primaryKeyType: primaryKeyType(),
      createOrAlter: 'alter',
    })
  }

  try {
    console.log(`generating migration: ${relFilePath}`)
    await fs.writeFile(absFilePath, finalContent)
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the migration file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }
}
