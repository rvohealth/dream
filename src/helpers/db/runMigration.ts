import { FileMigrationProvider, MigrationResult, Migrator } from 'kysely'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import DreamCLI from '../../cli/index.js'
import colorize from '../../cli/logger/loggable/colorize.js'
import db from '../../db/index.js'
import DreamApp from '../../dream-app/index.js'
import { closeAllConnectionsForConnectionName, closeAllDbConnections } from '../../db/DreamDbConnection.js'

type MigrationModes = 'migrate' | 'rollback'

interface MigrationOpts {
  connectionName: string
  mode?: MigrationModes
}

export default async function runMigration({ connectionName, mode = 'migrate' }: MigrationOpts) {
  const dreamApp = DreamApp.getOrFail()
  const migrationFolder =
    connectionName === 'default'
      ? path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations')
      : path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations', connectionName)

  // Ensure the migration folder exists
  await fs.mkdir(migrationFolder, { recursive: true })

  const kyselyDb = db(connectionName, 'primary')

  const migrator = new Migrator({
    db: kyselyDb,
    allowUnorderedMigrations: true,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  })

  if (mode === 'migrate') {
    await migrate(migrator)
  } else if (mode === 'rollback') {
    await rollback(migrator)
  }

  await closeAllConnectionsForConnectionName(connectionName)
}

async function migrate(migrator: Migrator) {
  let nextMigrationRequiringNewTransaction = await findNextMigrationRequiringNewTransaction(migrator)

  while (nextMigrationRequiringNewTransaction) {
    const migrateTo = await findMigrationBeforeNextMigrationRequiringNewTransaction(
      migrator,
      nextMigrationRequiringNewTransaction.name
    )

    if (migrateTo) {
      const { error, results } = await migrator.migrateTo(migrateTo)
      logResults(results, 'migrate')

      if (error) {
        await handleError(error, 'migrate')
        break
      }
    }

    nextMigrationRequiringNewTransaction = await findNextMigrationRequiringNewTransaction(migrator, {
      ignore: nextMigrationRequiringNewTransaction.name,
    })
  }

  const { error, results } = await migrator.migrateToLatest()
  logResults(results, 'migrate')

  if (error) await handleError(error, 'migrate')
}

async function findMigrationBeforeNextMigrationRequiringNewTransaction(
  migrator: Migrator,
  nextMigrationRequiringNewTransaction: string
) {
  const notYetRunMigrations = (await migrator.getMigrations())
    .filter(migrationInfo => !migrationInfo.executedAt)
    .map(migrationInfo => migrationInfo.name)

  const indexOfNextMigrationRequiringNewTransaction = notYetRunMigrations.findIndex(
    migrationName => migrationName === nextMigrationRequiringNewTransaction
  )

  return notYetRunMigrations[indexOfNextMigrationRequiringNewTransaction - 1]
}

async function findNextMigrationRequiringNewTransaction(
  migrator: Migrator,
  { ignore }: { ignore?: string } = {}
) {
  const notYetRunMigrations = (await migrator.getMigrations()).filter(
    migrationInfo => !migrationInfo.executedAt && migrationInfo.name !== ignore
  )

  for (const notYetRunMigration of notYetRunMigrations) {
    const upAndDownString =
      notYetRunMigration.migration.up.toString() + (notYetRunMigration.migration.down || '').toString()
    const migrationRequiresNewTransaction = upAndDownString.includes('DreamMigrationHelpers.dropEnumValue')
    if (migrationRequiresNewTransaction) return notYetRunMigration
  }
}

async function rollback(migrator: Migrator) {
  const { error, results } = await migrator.migrateDown()
  logResults(results, 'rollback')
  if (error) await handleError(error, 'rollback')
}

async function handleError(error: any, mode: MigrationModes) {
  await closeAllDbConnections()
  DreamApp.logWithLevel('error', `failed to ${migratedActionCurrentTense(mode)}`)
  DreamApp.logWithLevel('error', error)
  process.exit(1)
}

function migratedActionCurrentTense(mode: MigrationModes) {
  return mode === 'migrate' ? 'migrate' : 'roll'
}

function migratedActionPastTense(mode: MigrationModes) {
  return mode === 'migrate' ? 'migrated' : 'rolled back'
}

function logResults(results: MigrationResult[] | undefined, mode: MigrationModes) {
  results?.forEach(it => {
    if (it.status === 'Success') {
      DreamCLI.logger.logContinueProgress(
        colorize(`[db]`, { color: 'cyan' }) +
          ` migration "${it.migrationName}" was ${migratedActionPastTense(mode)} successfully`,
        { logPrefixColor: 'cyan' }
      )
    } else if (it.status === 'Error') {
      DreamCLI.logger.logContinueProgress(JSON.stringify(it, null, 2))
      DreamCLI.logger.logContinueProgress(
        colorize(`failed to ${migratedActionCurrentTense(mode)} migration "${it.migrationName}"`, {
          color: 'redBright',
        })
      )
    }
  })
}
