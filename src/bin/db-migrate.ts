import '../helpers/loadEnv'
import db from '../db'
import runMigration from '../helpers/db/runMigration'
import loadDreamconfFile from '../../shared/helpers/path/loadDreamconfFile'

async function migrateToLatest() {
  await runMigration({ mode: 'migrate' })

  const dreamconf = await loadDreamconfFile()
  await db('primary', dreamconf).destroy()
}

migrateToLatest()
