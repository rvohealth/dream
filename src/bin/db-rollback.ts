import '../helpers/loadEnv'
import db from '../db'
import runMigration from '../helpers/db/runMigration'

async function dbRollback() {
  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await runMigration({ mode: 'rollback', step })
    step -= 1
  }

  await db().destroy()
}

dbRollback()
