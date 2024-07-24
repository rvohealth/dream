import fs from 'fs/promises'
import path from 'path'
import absoluteFilePath from '../absoluteFilePath'
import generateMigrationContent from '../cli/generateMigrationContent'
import primaryKeyType from '../db/primaryKeyType'
import hyphenize from '../hyphenize'
import migrationVersion from '../migrationVersion'
import relativeDreamPath from '../path/relativeDreamPath'

export default async function generateMigration(migrationName: string) {
  const migrationBasePath = absoluteFilePath(path.join(await relativeDreamPath('db'), 'migrations'))
  const version = migrationVersion()
  const migrationFilename = `${hyphenize(migrationName)}`
  const versionedMigrationFilename = `${version}-${migrationFilename}`
  const migrationPath = `${migrationBasePath}/${versionedMigrationFilename.replace(/\//g, '-')}.ts`
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating migration: ${migrationPath}`)
    await thisfs.writeFile(migrationPath, generateMigrationContent({ primaryKeyType: primaryKeyType() }))
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
