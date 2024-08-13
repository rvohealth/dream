import { promises as fs } from 'fs'
import { FileMigrationProvider, Migrator } from 'kysely'
import path from 'path'
import db from '../../db'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default async function runMigration({
  mode = 'migrate',
  // step = 1,
}: { mode?: 'migrate' | 'rollback'; step?: number } = {}) {
  const dreamApp = getCachedDreamApplicationOrFail()
  const migrationFolder = path.join(dreamApp.appRoot, dreamApp.paths.db, 'migrations')

  const migrator = new Migrator({
    db: db('primary', dreamApp),
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
      console.log(`migration "${it.migrationName}" was ${migratedActionPastTense} successfully`)
    } else if (it.status === 'Error') {
      console.log(it)
      console.error(`failed to ${migratedActionCurrentTense} migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error(`failed to ${migratedActionCurrentTense}`)
    console.error(error)
    process.exit(1)
  }
}
