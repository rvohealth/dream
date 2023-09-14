import '../helpers/loadEnv'
import db from '../db'
import runMigration from '../helpers/db/runMigration'
import loadDreamconfFile from '../../shared/helpers/path/loadDreamconfFile'

async function dbRollback() {
  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await runMigration({ mode: 'rollback', step })
    step -= 1
  }

  const dreamconf = await loadDreamconfFile()
  await db('primary', dreamconf).destroy()
}

dbRollback()
