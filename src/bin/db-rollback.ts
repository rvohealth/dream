import db from '../db'
import Dreamconf from '../dreamconf'
import { getCachedDreamconfOrFail } from '../dreamconf/cache'
import runMigration from '../helpers/db/runMigration'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

async function dbRollback() {
  await Dreamconf.loadAndApplyConfig()
  await initializeDream()

  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await runMigration({ mode: 'rollback', step })
    step -= 1
  }

  await db('primary', getCachedDreamconfOrFail()).destroy()
  process.exit()
}

void dbRollback()
