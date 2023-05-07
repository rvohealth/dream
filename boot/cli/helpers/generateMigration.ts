import * as fs from 'fs/promises'
import migrationVersion from './migrationVersion'
import hyphenize from '../../../src/helpers/hyphenize'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'
import { loadDreamYamlFile } from '../../../src/helpers/path'

export default async function generateMigration(
  migrationName: string,
  {
    rootPath = absoluteFilePath(''),
  }: {
    rootPath?: string
  } = {}
) {
  const yamlConf = await loadDreamYamlFile()
  const migrationBasePath = absoluteFilePath(yamlConf.migrations_path)
  const version = migrationVersion()
  const migrationFilename = `${hyphenize(migrationName)}`
  const versionedMigrationFilename = `${version}-${migrationFilename}`
  const migrationPath = `${migrationBasePath}/${versionedMigrationFilename.replace(/\//g, '-')}.ts`
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating migration: ${migrationPath}`)
    await thisfs.writeFile(migrationPath, generateMigrationContent())
  } catch (error) {
    const err = `
      Something happened while trying to create the migration file:
        ${migrationPath}

      Does this file already exist? Here is the error that was raised:
        ${error}
    `
    console.log(err)
    throw err
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('done!')
  }
}
