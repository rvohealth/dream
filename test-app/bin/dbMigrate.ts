import '../helpers/loadEnv'

import { initializeDreamApplication } from '../app/conf/dream'
import db from '../db'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import runMigration from '../helpers/db/runMigration'

async function migrateToLatest() {
  await initializeDreamApplication()

  await runMigration({ mode: 'migrate' })

  await db('primary', getCachedDreamApplicationOrFail()).destroy()
  process.exit()
}

void migrateToLatest()
