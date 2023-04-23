import * as fs from 'fs/promises'
import migrationTimestamp from './migrationTimestamp'
import hyphenize from '../../../src/helpers/hyphenize'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'

export default async function generateMigration(
  migrationName: string,
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
  }: {
    rootPath?: string
  } = {}
) {
  const migrationBasePath =
    process.env.CORE_DEVELOPMENT === '1'
      ? `${rootPath}/test-app/db/migrations`
      : `${rootPath}/src/db/migrations`
  const timestamp = migrationTimestamp()
  const migrationFilename = `${hyphenize(migrationName)}`
  const timestampedMigrationFilename = `${timestamp}-${migrationFilename}`
  const migrationPath = `${migrationBasePath}/${timestampedMigrationFilename}.ts`
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
