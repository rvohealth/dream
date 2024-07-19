import db from '../db'
import runMigration from '../helpers/db/runMigration'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'
import loadEnvConf from '../helpers/path/loadEnvConf'

async function dbRollback() {
  await initializeDream()

  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await runMigration({ mode: 'rollback', step })
    step -= 1
  }

  await db('primary', await loadEnvConf()).destroy()
  process.exit()
}

void dbRollback()
