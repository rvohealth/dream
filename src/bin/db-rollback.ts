import db from '../db'
import DreamApplication from '../dream-application'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import runMigration from '../helpers/db/runMigration'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

async function dbRollback() {
  await DreamApplication.configure()
  await initializeDream()

  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await runMigration({ mode: 'rollback', step })
    step -= 1
  }

  await db('primary', getCachedDreamApplicationOrFail()).destroy()
  process.exit()
}

void dbRollback()
