import * as fs from 'fs/promises'
import { FileMigrationProvider, MigrationResult, Migrator } from 'kysely'
import * as path from 'path'
import DreamDbConnection from '../../db/DreamDbConnection.js'
import db from '../../db/index.js'
import DreamApplication from '../../dream-application/index.js'

type MigrationModes = 'migrate' | 'rollback'

interface MigrationOpts {
  mode?: MigrationModes
}

export default async function runMigration({ mode = 'migrate' }: MigrationOpts = {}) {
  const dreamApp = DreamApplication.getOrFail()
  const migrationFolder = path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations')

  const kyselyDb = db('primary')

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
    await migrate(migrator, migrationFolder)
  } else if (mode === 'rollback') {
    await rollback(migrator)
  }

  await DreamDbConnection.dropAllConnections()
}

async function migrate(migrator: Migrator, migrationFolder: string) {
  let nextMigrationRequiringNewTransaction = await findNextMigrationRequiringNewTransaction(
    migrator,
    migrationFolder
  )

  while (nextMigrationRequiringNewTransaction) {
    const migrateTo = await findMigrationBeforeNextMigrationRequiringNewTransaction(
      migrator,
      nextMigrationRequiringNewTransaction
    )

    if (migrateTo) {
      const { error, results } = await migrator.migrateTo(migrateTo)
      logResults(results, 'migrate')

      if (error) {
        await handleError(error, 'migrate')
        break
      }
    }

    nextMigrationRequiringNewTransaction = await findNextMigrationRequiringNewTransaction(
      migrator,
      migrationFolder,
      { ignore: nextMigrationRequiringNewTransaction }
    )
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
  migrationFolder: string,
  { ignore }: { ignore?: string } = {}
) {
  const notYetRunMigrations = (await migrator.getMigrations())
    .filter(migrationInfo => !migrationInfo.executedAt)
    .map(migrationInfo => migrationInfo.name)
    .filter(name => name !== ignore)

  for (const notYetRunMigration of notYetRunMigrations) {
    const filepath = path.join(migrationFolder, `${notYetRunMigration}.ts`)
    const migrationRequiresNewTransaction = (await fs.readFile(filepath)).includes(
      'DreamMigrationHelpers.dropEnumValue'
    )
    if (migrationRequiresNewTransaction) return notYetRunMigration
  }
}

async function rollback(migrator: Migrator) {
  const { error, results } = await migrator.migrateDown()
  logResults(results, 'rollback')
  if (error) await handleError(error, 'rollback')
}

async function handleError(error: any, mode: MigrationModes) {
  await DreamDbConnection.dropAllConnections()
  DreamApplication.logWithLevel('error', `failed to ${migratedActionCurrentTense(mode)}`)
  DreamApplication.logWithLevel('error', error)
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
      console.log(`migration "${it.migrationName}" was ${migratedActionPastTense(mode)} successfully`)
    } else if (it.status === 'Error') {
      console.log(it)
      console.error(`failed to ${migratedActionCurrentTense(mode)} migration "${it.migrationName}"`)
    }
  })
}
