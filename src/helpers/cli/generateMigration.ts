import fs from 'fs/promises'
import path from 'path'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'
import generateMigrationContent from '../cli/generateMigrationContent'
import primaryKeyType from '../db/primaryKeyType'
import hyphenize from '../hyphenize'
import migrationVersion from '../migrationVersion'
import dreamPath from '../path/dreamPath'

export default async function generateMigration(migrationName: string) {
  const dreamApp = getCachedDreamApplicationOrFail()

  const migrationBasePath = path.join(dreamApp.appRoot, dreamPath('db'), 'migrations')
  const version = migrationVersion()
  const migrationFilename = `${hyphenize(migrationName)}`
  const versionedMigrationFilename = `${version}-${migrationFilename}`
  const migrationPath = `${migrationBasePath}/${versionedMigrationFilename.replace(/\//g, '-')}.ts`

  try {
    console.log(`generating migration: ${migrationPath}`)
    await fs.writeFile(migrationPath, generateMigrationContent({ primaryKeyType: primaryKeyType() }))
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
