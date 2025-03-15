import * as fs from 'fs/promises'
import * as path from 'path'
import pluralize from 'pluralize-esm'
import generateMigrationContent from '../cli/generateMigrationContent.js.js'
import primaryKeyType from '../db/primaryKeyType.js.js'
import hyphenize from '../hyphenize.js.js'
import migrationVersion from '../migrationVersion.js.js'
import pascalizePath from '../pascalizePath.js.js'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js.js'
import dreamPath from '../path/dreamPath.js.js'
import snakeify from '../snakeify.js.js'
import generateStiMigrationContent from './generateStiMigrationContent.js.js'

export default async function generateMigration({
  migrationName,
  columnsWithTypes,
  fullyQualifiedModelName,
  fullyQualifiedParentName,
}: {
  migrationName: string
  columnsWithTypes: string[]
  fullyQualifiedModelName?: string
  fullyQualifiedParentName?: string
}) {
  const { relFilePath, absFilePath } = dreamFileAndDirPaths(
    path.join(dreamPath('db'), 'migrations'),
    `${migrationVersion()}-${hyphenize(migrationName).replace(/\//g, '-')}.ts`
  )

  const isSTI = !!fullyQualifiedParentName
  let finalContent: string = ''

  if (isSTI) {
    finalContent = generateStiMigrationContent({
      table: snakeify(pluralize(pascalizePath(fullyQualifiedParentName))),
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
      table: tableName ? pluralize(snakeify(tableName)) : '<table-name>',
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
