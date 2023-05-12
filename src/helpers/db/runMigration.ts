import { FileMigrationProvider, Migrator } from 'kysely'
import { loadDreamYamlFile } from '../path'
import { promises as fs } from 'fs'
import path from 'path'
import db from '../../db'
import absoluteFilePath from '../absoluteFilePath'

export default async function runMigration({
  mode = 'migrate',
  step = 1,
}: { mode?: 'migrate' | 'rollback'; step?: number } = {}) {
  const yamlConf = await loadDreamYamlFile()
  const migrationFolder = absoluteFilePath(yamlConf.migrations_path)

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  })

  const migrationMethod = mode === 'migrate' ? 'migrateToLatest' : 'migrateDown'
  const { error, results } = await migrator[migrationMethod]()

  const migratedActionPastTense = mode === 'migrate' ? 'migrated' : 'rolled back'
  const migratedActionCurrentTense = mode === 'migrate' ? 'migrate' : 'roll'
  results?.forEach(it => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was ${migratedActionPastTense} successfully`)
    } else if (it.status === 'Error') {
      console.log(it)
      console.error(`failed to ${migratedActionCurrentTense} migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error(`failed to ${migratedActionCurrentTense}`)
    console.error(error)
    process.exit(1)
  }
}
