import db from '../db'
import runMigration from '../helpers/db/runMigration'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'
import loadEnvConf from '../helpers/path/loadEnvConf'

async function migrateToLatest() {
  await initializeDream()

  await runMigration({ mode: 'migrate' })

  await db('primary', await loadEnvConf()).destroy()
  process.exit()
}

void migrateToLatest()
