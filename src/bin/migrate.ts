import * as path from 'path'
import { Pool } from 'pg'
import { promises as fs } from 'fs'
import { Kysely, Migrator, PostgresDialect, FileMigrationProvider } from 'kysely'
import { loadDB } from '../helpers/path'

async function migrateToLatest() {
  const db = await loadDB()
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '..', 'test-app', 'db', 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(it => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.log(it)
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
