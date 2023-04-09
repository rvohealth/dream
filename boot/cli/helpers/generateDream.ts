import * as pluralize from 'pluralize'
import * as fs from 'fs/promises'
import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'
import migrationTimestamp from './migrationTimestamp'
import { loadDreamYamlFile } from '../../../src/helpers/path'
import hyphenize from '../../../src/helpers/hyphenize'
import snakeify from '../../../src/helpers/snakeify'

export default async function generateDream(
  dreamName: string,
  attributes: string[],
  {
    rootPath = process.cwd(),
    allowExit = true,
  }: {
    rootPath?: string
    allowExit?: boolean
  } = {}
) {
  const ymlConfig = await loadDreamYamlFile()
  // TODO: add uuid support
  const useUUID = false

  const dreamBasePath = `${rootPath}/${ymlConfig.models_path}`
  const dreamPath = `${dreamBasePath}/${hyphenize(pluralize.singular(dreamName))}.ts`
  const dreamPathParts = dreamName.split('/')
  const thisfs = fs ? fs : await import('fs/promises')

  // we don't need this value, just doing it so we can discard the file name and
  // thus only have the filepath left. This helps us handle a case where one wants
  // to generate a nested controller, like so:
  //    howl g:controller api/v1/users
  const dreamActualFilename = dreamPathParts.pop()

  // if they are generating a nested controller path,
  // we need to make sure the nested directories exist
  if (!!dreamPathParts.length) {
    const fullPath = [...dreamBasePath.split('/'), ...dreamPathParts].join('/')
    await thisfs.mkdir(fullPath, { recursive: true })
  }

  try {
    console.log(`generating dream: ${dreamPath}`)
    await thisfs.writeFile(dreamPath, generateDreamContent(dreamName, attributes, { useUUID }))
  } catch (error) {
    const err = `
      Something happened while trying to create the dream file:
        ${dreamPath}

      Does this file already exist? Here is the error that was raised:
        ${error}
    `
    console.log(err)
    throw err
  }

  const migrationBasePath = `${rootPath}/${ymlConfig.migrations_path}`
  const timestamp = migrationTimestamp()
  const migrationPath = `${migrationBasePath}/${timestamp}-create-${pluralize(hyphenize(dreamName))}.ts`

  try {
    console.log(`generating migration: ${migrationPath}`)
    await thisfs.writeFile(
      migrationPath,
      generateMigrationContent(`create-${hyphenize(pluralize(dreamName))}`, timestamp, {
        table: snakeify(pluralize(dreamName)),
        attributes,
        useUUID,
      })
    )
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

  if (process.env.NODE_ENV !== 'test' && allowExit) {
    console.log('done!')
    process.exit()
  }
}
