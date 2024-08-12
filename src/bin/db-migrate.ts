import db from '../db'
import DreamApplication from '../dream-application'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import runMigration from '../helpers/db/runMigration'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

async function migrateToLatest() {
  await DreamApplication.configure()
  await initializeDream()

  await runMigration({ mode: 'migrate' })

  await db('primary', getCachedDreamApplicationOrFail()).destroy()
  process.exit()
}

void migrateToLatest()
