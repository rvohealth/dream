import db from '../db'
import Dreamconf from '../dreamconf'
import { getCachedDreamconfOrFail } from '../dreamconf/cache'
import runMigration from '../helpers/db/runMigration'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

async function migrateToLatest() {
  await Dreamconf.configure()
  await initializeDream()

  await runMigration({ mode: 'migrate' })

  await db('primary', getCachedDreamconfOrFail()).destroy()
  process.exit()
}

void migrateToLatest()
