import '../helpers/loadEnv'
import db from '../db'
import runMigration from '../helpers/db/runMigration'
import loadDreamconfFile from '../helpers/path/loadDreamconfFile'
import initializeDream from '../helpers/initializeDream'

async function migrateToLatest() {
  await initializeDream()

  await runMigration({ mode: 'migrate' })

  const dreamconf = await loadDreamconfFile()
  await db('primary', dreamconf).destroy()
  process.exit()
}

void migrateToLatest()
