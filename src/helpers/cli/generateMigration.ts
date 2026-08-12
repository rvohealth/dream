import * as path from 'node:path'
import pluralize from 'pluralize-esm'
import InvalidMigrationTableName from '../../errors/InvalidMigrationTableName.js'
import generateMigrationContent, {
  MIGRATION_TABLE_NAME_PLACEHOLDER,
} from '../cli/generateMigrationContent.js'
import primaryKeyType from '../db/primaryKeyType.js'
import hyphenize from '../hyphenize.js'
import migrationVersion from '../migrationVersion.js'
import pascalizePath from '../pascalizePath.js'
import dreamPath from '../path/dreamPath.js'
import snakeify from '../snakeify.js'
import generateStiMigrationContent from './generateStiMigrationContent.js'
import writeGeneratedFile from './writeGeneratedFile.js'

/**
 * Equivalent to `migrationName.match(new RegExp(`${marker}(.+)$`))?.[1]`, but
 * without a regex: CodeQL flags `.+` anchored to `$` as a polynomial-ReDoS
 * shape, and a plain `indexOf`/`slice` does the same leftmost-match-to-end
 * job with no backtracking risk.
 */
function tableNameFromSuffix(migrationName: string, marker: string): string | undefined {
  const markerIndex = migrationName.indexOf(marker)
  if (markerIndex === -1) return undefined
  return migrationName.slice(markerIndex + marker.length) || undefined
}

/**
 * A table name derived from a migration name is written verbatim into a
 * single-quoted string literal in the generated migration file, which
 * `db:migrate` later executes. Anything that is not a plain identifier could
 * therefore close that literal and inject statements, so the generator fails
 * closed instead of escaping.
 *
 * This is a pure string check: it never consults the database, since the
 * derived name legitimately need not be an existing table (e.g.
 * `add-treehouse-to-place-styles` targets a Postgres enum).
 */
const VALID_DERIVED_TABLE_NAME = /^[a-z_][a-z0-9_]*$/

function validTableNameOrThrow(migrationName: string, table: string): string {
  if (!VALID_DERIVED_TABLE_NAME.test(table)) throw new InvalidMigrationTableName(migrationName, table)
  return table
}

export default async function generateMigration({
  migrationName,
  columnsWithTypes,
  connectionName,
  fullyQualifiedModelName,
  fullyQualifiedParentName,
  tableName: explicitTableName,
  modelClassName,
  softDelete = false,
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
  /**
   * When true (and not an STI child), the generated `createTable` migration
   * includes a nullable `deleted_at` column alongside the standard
   * `created_at` / `updated_at` timestamps.
   */
  softDelete?: boolean
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
      softDelete,
    })
  } else {
    const toTableName: string | undefined = tableNameFromSuffix(migrationName, '-to-')
    const fromTableName: string | undefined = toTableName
      ? undefined
      : tableNameFromSuffix(migrationName, '-from-')
    const tableName = toTableName || fromTableName
    const table = tableName
      ? validTableNameOrThrow(migrationName, pluralize(snakeify(tableName)))
      : MIGRATION_TABLE_NAME_PLACEHOLDER

    content = generateMigrationContent({
      table,
      columnsWithTypes,
      primaryKeyType: primaryKeyType(connectionName)!,
      createOrAlter: 'alter',
      alterDirection: fromTableName ? 'remove' : 'add',
      migrationName,
      alterMarker: toTableName ? '-to-' : fromTableName ? '-from-' : undefined,
    })
  }

  await writeGeneratedFile({
    basePath: migrationsBasePath,
    fileName,
    content,
    logLabel: 'migration',
  })
}
