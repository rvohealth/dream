import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import pluralize from 'pluralize-esm'
import generateMigrationContent from '../cli/generateMigrationContent.js'
import primaryKeyType from '../db/primaryKeyType.js'
import hyphenize from '../hyphenize.js'
import migrationVersion from '../migrationVersion.js'
import pascalizePath from '../pascalizePath.js'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath from '../path/dreamPath.js'
import snakeify from '../snakeify.js'
import generateStiMigrationContent from './generateStiMigrationContent.js'
import DreamCLI from '../../cli/index.js'

export default async function generateMigration({
  migrationName,
  columnsWithTypes,
  connectionName,
  fullyQualifiedModelName,
  fullyQualifiedParentName,
  tableName: explicitTableName,
}: {
  migrationName: string
  columnsWithTypes: string[]
  connectionName: string
  fullyQualifiedModelName?: string | undefined
  fullyQualifiedParentName?: string | undefined
  tableName?: string | undefined
}) {
  const { relFilePath, absFilePath } =
    connectionName === 'default'
      ? dreamFileAndDirPaths(
          path.join(dreamPath('db'), 'migrations'),
          `${migrationVersion()}-${hyphenize(migrationName).replace(/\//g, '-')}.ts`
        )
      : dreamFileAndDirPaths(
          path.join(dreamPath('db'), 'migrations', connectionName),
          `${migrationVersion()}-${hyphenize(migrationName).replace(/\//g, '-')}.ts`
        )

  const isSTI = !!fullyQualifiedParentName
  let finalContent: string = ''

  if (isSTI) {
    finalContent = generateStiMigrationContent({
      table: snakeify(pluralize(pascalizePath(fullyQualifiedParentName))),
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
      stiChildClassName: pascalizePath(fullyQualifiedModelName!),
    })
  } else if (fullyQualifiedModelName) {
    finalContent = generateMigrationContent({
      table: explicitTableName || snakeify(pluralize(pascalizePath(fullyQualifiedModelName))),
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
    })
  } else {
    const tableName: string | undefined = migrationName.match(/-to-(.+)$/)?.[1]
    finalContent = generateMigrationContent({
      table: tableName ? pluralize(snakeify(tableName)) : '<table-name>',
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
      createOrAlter: 'alter',
    })
  }

  try {
    DreamCLI.logger.log(`[dream] generating migration: ${relFilePath}`)
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
