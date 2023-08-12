import '../helpers/loadEnv'
import db from '../db'
import runMigration from '../helpers/db/runMigration'

async function migrateToLatest() {
  await runMigration({ mode: 'migrate' })
  await db().destroy()
}

migrateToLatest()
