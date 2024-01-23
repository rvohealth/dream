import '../helpers/loadEnv'
import db from '../db'
import runMigration from '../helpers/db/runMigration'
import loadDreamconfFile from '../../shared/helpers/path/loadDreamconfFile'
import initializeDream from '../../shared/helpers/initializeDream'

async function migrateToLatest() {
  await initializeDream()

  await runMigration({ mode: 'migrate' })

  const dreamconf = await loadDreamconfFile()
  await db('primary', dreamconf).destroy()
  process.exit()
}

// eslint-disable-next-line
migrateToLatest()
