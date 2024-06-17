import fs from 'fs/promises'
import { FileMigrationProvider, Migrator } from 'kysely'
import path from 'path'
import db from '../../db'
import DreamApplication from '../../dream-application'
import DreamDbConnection from '../../db/dream-db-connection'

export default async function runMigration({
  mode = 'migrate',
  // step = 1,
}: { mode?: 'migrate' | 'rollback'; step?: number } = {}) {
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

  const migrationMethod = mode === 'migrate' ? 'migrateToLatest' : 'migrateDown'
  const { error, results } = await migrator[migrationMethod]()

  const migratedActionPastTense = mode === 'migrate' ? 'migrated' : 'rolled back'
  const migratedActionCurrentTense = mode === 'migrate' ? 'migrate' : 'roll'
  results?.forEach(it => {
    if (it.status === 'Success') {
      DreamApplication.log(
        'log',
        `migration "${it.migrationName}" was ${migratedActionPastTense} successfully`
      )
    } else if (it.status === 'Error') {
      DreamApplication.log(it)
      DreamApplication.logWithLevel(
        'error',
        `failed to ${migratedActionCurrentTense} migration "${it.migrationName}"`
      )
    }
  })

  if (error) {
    DreamApplication.logWithLevel('error', `failed to ${migratedActionCurrentTense}`)
    DreamApplication.logWithLevel('error', error)
    process.exit(1)
  }

  await DreamDbConnection.dropAllConnections()
}
