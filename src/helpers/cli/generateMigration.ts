import path from 'path'
import fs from 'fs/promises'
import migrationVersion from '../migrationVersion'
import hyphenize from '../hyphenize'
import generateMigrationContent from '../cli/generateMigrationContent'
import absoluteFilePath from '../absoluteFilePath'
import { loadDreamYamlFile } from '../path'
import primaryKeyType from '../db/primaryKeyType'

export default async function generateMigration(migrationName: string) {
  const yamlConf = await loadDreamYamlFile()
  const migrationBasePath = absoluteFilePath(path.join(yamlConf.db_path, 'migrations'))
  const version = migrationVersion()
  const migrationFilename = `${hyphenize(migrationName)}`
  const versionedMigrationFilename = `${version}-${migrationFilename}`
  const migrationPath = `${migrationBasePath}/${versionedMigrationFilename.replace(/\//g, '-')}.ts`
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating migration: ${migrationPath}`)
    await thisfs.writeFile(
      migrationPath,
      generateMigrationContent({ primaryKeyType: await primaryKeyType() })
    )
  } catch (error) {
    const err = `
      Something happened while trying to create the migration file:
        ${migrationPath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `
    console.log(err)
    throw err
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('done!')
  }
}
