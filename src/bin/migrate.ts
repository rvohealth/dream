import * as path from 'path'
import { promises as fs } from 'fs'
import { Migrator, FileMigrationProvider } from 'kysely'
import db from '../db'
import { loadDreamYamlFile } from '../helpers/path'

async function migrateToLatest() {
  const yamlConf = await loadDreamYamlFile()
  const migrationFolder =
    process.env.CORE_DEVELOPMENT === '1'
      ? path.join(__dirname, '..', 'test-app', 'db', 'migrations')
      : path.join(__dirname, '..', '..', '..', '..', yamlConf.migrations_path)
  console.log('MIGRATION STUFF', migrationFolder)

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(it => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.log(it)
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
