import * as path from 'node:path'
import pluralize from 'pluralize-esm'
import generateMigrationContent from '../cli/generateMigrationContent.js'
import primaryKeyType from '../db/primaryKeyType.js'
import hyphenize from '../hyphenize.js'
import migrationVersion from '../migrationVersion.js'
import pascalizePath from '../pascalizePath.js'
import dreamPath from '../path/dreamPath.js'
import snakeify from '../snakeify.js'
import generateStiMigrationContent from './generateStiMigrationContent.js'
import writeGeneratedFile from './writeGeneratedFile.js'

export default async function generateMigration({
  migrationName,
  columnsWithTypes,
  connectionName,
  fullyQualifiedModelName,
  fullyQualifiedParentName,
  tableName: explicitTableName,
  modelClassName,
}: {
  migrationName: string
  columnsWithTypes: string[]
  connectionName: string
  fullyQualifiedModelName?: string | undefined
  fullyQualifiedParentName?: string | undefined
  tableName?: string | undefined
  /**
   * Model class name, computed once via modelClassNameFrom in the orchestrator.
   * Required when generating a migration for a model (especially STI children).
   * Omitted for standalone `g:migration` commands.
   */
  modelClassName?: string | undefined
}) {
  const migrationsBasePath =
    connectionName === 'default'
      ? path.join(dreamPath('db'), 'migrations')
      : path.join(dreamPath('db'), 'migrations', connectionName)

  const fileName = `${migrationVersion()}-${hyphenize(migrationName).replace(/\//g, '-')}.ts`

  const isSTI = !!fullyQualifiedParentName
  let content: string = ''

  if (isSTI) {
    content = generateStiMigrationContent({
      table: snakeify(pluralize(pascalizePath(fullyQualifiedParentName))),
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
      stiChildClassName: modelClassName || pascalizePath(fullyQualifiedModelName!),
    })
  } else if (fullyQualifiedModelName) {
    content = generateMigrationContent({
      table: explicitTableName || snakeify(pluralize(pascalizePath(fullyQualifiedModelName))),
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
    })
  } else {
    const tableName: string | undefined = migrationName.match(/-to-(.+)$/)?.[1]
    content = generateMigrationContent({
      table: tableName ? pluralize(snakeify(tableName)) : '<table-name>',
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
      createOrAlter: 'alter',
    })
  }

  await writeGeneratedFile({
    basePath: migrationsBasePath,
    fileName,
    content,
    logLabel: 'migration',
  })
}
