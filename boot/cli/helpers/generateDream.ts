import * as pluralize from 'pluralize'
import * as fs from 'fs/promises'
import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'
import migrationVersion from './migrationVersion'
import { loadDreamYamlFile } from '../../../src/helpers/path'
import hyphenize from '../../../src/helpers/hyphenize'
import snakeify from '../../../src/helpers/snakeify'
import pascalize from '../../../src/helpers/pascalize'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'
import generateUnitSpec from './generateUnitSpec'

export default async function generateDream(
  dreamName: string,
  attributes: string[],
  {
    rootPath = absoluteFilePath(''),
  }: {
    rootPath?: string
  } = {}
) {
  const ymlConfig = await loadDreamYamlFile()
  // TODO: add uuid support
  const useUUID = false

  const dreamBasePath = `${rootPath}/${ymlConfig.models_path}`
  const formattedDreamName = pluralize
    .singular(dreamName)
    .split('/')
    .map(pathName => pascalize(pathName))
    .join('/')
  const dreamPath = `${dreamBasePath}/${formattedDreamName}.ts`
  const relativeDreamPath = dreamPath.replace(
    new RegExp(`^.*${ymlConfig.models_path}`),
    ymlConfig.models_path
  )
  const dreamPathParts = formattedDreamName.split('/')
  const thisfs = fs ? fs : await import('fs/promises')

  // we don't need this value, just doing it so we can discard the file name and
  // thus only have the filepath left. This helps us handle a case where one wants
  // to generate a nested controller, like so:
  //    howl g:controller api/v1/users
  const dreamActualFilename = dreamPathParts.pop()

  // if they are generating a nested model path,
  // we need to make sure the nested directories exist
  if (!!dreamPathParts.length) {
    const fullPath = [...dreamBasePath.split('/'), ...dreamPathParts].join('/')
    await thisfs.mkdir(fullPath, { recursive: true })
  }

  try {
    console.log(`generating dream: ${relativeDreamPath}`)
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

  await generateUnitSpec(dreamName, 'models', { rootPath })

  const migrationBasePath = `${rootPath}/${ymlConfig.migrations_path}`
  const version = migrationVersion()
  const migrationPath = `${migrationBasePath}/${version}-create-${pluralize(hyphenize(dreamName))}.ts`
  const relativeMigrationPath = migrationPath.replace(
    new RegExp(`^.*${ymlConfig.migrations_path}`),
    ymlConfig.migrations_path
  )

  try {
    console.log(`generating migration: ${relativeMigrationPath}`)
    await thisfs.writeFile(
      migrationPath,
      generateMigrationContent({
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

  if (process.env.NODE_ENV !== 'test') {
    console.log('done!')
  }
}
