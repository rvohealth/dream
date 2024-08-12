import '../helpers/loadEnv'

import { initializeDreamApplication } from '../app/conf/dream'
import db from '../db'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import runMigration from '../helpers/db/runMigration'

async function dbRollback() {
  await initializeDreamApplication()

  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await runMigration({ mode: 'rollback', step })
    step -= 1
  }

  await db('primary', getCachedDreamApplicationOrFail()).destroy()
  process.exit()
}

void dbRollback()
