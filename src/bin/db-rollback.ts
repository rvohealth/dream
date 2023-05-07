import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import { Migrator, FileMigrationProvider } from 'kysely'
import db from '../db'
import { loadDreamYamlFile } from '../helpers/path'

async function dbRollback() {
  let step = process.argv[2] ? parseInt(process.argv[2]) : 1
  while (step > 0) {
    await doRollback()
    step -= 1
  }

  await db.destroy()
}

async function doRollback() {
  const yamlConf = await loadDreamYamlFile()
  const migrationFolder =
    process.env.DREAM_CORE_DEVELOPMENT === '1'
      ? path.join(__dirname, '..', '..', 'test-app', 'db', 'migrations')
      : path.join(__dirname, '..', '..', '..', '..', yamlConf.migrations_path)

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  })
  const { error, results } = await migrator.migrateDown()

  results?.forEach(it => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was rolled back successfully`)
    } else if (it.status === 'Error') {
      console.log(it)
      console.error(`failed to roll back migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to roll back')
    console.error(error)
    process.exit(1)
  }
}

dbRollback()
