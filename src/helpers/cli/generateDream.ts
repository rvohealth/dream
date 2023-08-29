import pluralize from 'pluralize'
import fs from 'fs/promises'
import generateDreamContent from './generateDreamContent'
import generateMigrationContent from './generateMigrationContent'
import generateSerializerContent from './generateSerializerContent'
import migrationVersion from '../migrationVersion'
import { loadDreamYamlFile, migrationsPath, modelsPath } from '../path'
import hyphenize from '../hyphenize'
import snakeify from '../../../shared/helpers/snakeify'
import pascalize from '../pascalize'
import absoluteFilePath from '../absoluteFilePath'
import generateUnitSpec from './generateUnitSpec'
import serializersPath from '../../../shared/helpers/path/serializersPath'
import path from 'path'

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

  const dreamBasePath = await modelsPath()
  const formattedDreamName = pluralize
    .singular(dreamName)
    .split('/')
    .map(pathName => pascalize(pathName))
    .join('/')
  const dreamPath = path.join(dreamBasePath, `${formattedDreamName}.ts`)
  const relativeDreamPath = dreamPath.replace(dreamBasePath, ymlConfig.models_path)
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

  const content = await generateDreamContent(dreamName, attributes, { useUUID })

  try {
    console.log(`generating dream: ${relativeDreamPath}`)
    await thisfs.writeFile(dreamPath, content)
  } catch (error) {
    const err = `
      Something happened while trying to create the dream file:
        ${dreamPath}

      Does this file already exist? Here is the error that was raised:
        ${error}
    `
    console.error(err)
    console.error(error)
    console.trace()
    throw error
  }

  await generateUnitSpec(dreamName, 'models', { rootPath })

  const migrationBasePath = await migrationsPath()
  const version = migrationVersion()
  const migrationPath = `${migrationBasePath}/${version}-create-${pluralize(hyphenize(dreamName))}.ts`
  const relativeMigrationPath = migrationPath.replace(
    new RegExp(`^.*${ymlConfig.migrations_path}`),
    ymlConfig.migrations_path
  )

  const finalContent = generateMigrationContent({
    table: snakeify(pluralize(dreamName)),
    attributes,
    useUUID,
  })
  try {
    console.log(`generating migration: ${relativeMigrationPath}`)
    await thisfs.writeFile(migrationPath, finalContent)
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

  const serializerBasePath = await serializersPath()
  const fullyQualifiedSerializerName =
    pluralize
      .singular(dreamName)
      .split('/')
      .map(pathName => pascalize(pathName))
      .join('/') + 'Serializer'
  const serializerPath = path.join(serializerBasePath, `${fullyQualifiedSerializerName}.ts`)
  const relativeSerializerPath = serializerPath.replace(
    new RegExp(`^.*${ymlConfig.serializers_path}`),
    ymlConfig.serializers_path
  )
  const serializerPathParts = fullyQualifiedSerializerName.split('/')

  if (!!serializerPathParts.length) {
    const fullSerializerPath = [...serializerBasePath.split('/'), ...serializerPathParts.slice(0, -1)].join(
      '/'
    )
    await thisfs.mkdir(fullSerializerPath, { recursive: true })
  }

  try {
    console.log(`generating serializer: ${relativeSerializerPath}`)
    await thisfs.writeFile(
      serializerPath,
      await generateSerializerContent(fullyQualifiedSerializerName, dreamName, attributes)
    )
  } catch (error) {
    const err = `
      Something happened while trying to create the serializer file:
        ${dreamPath}

      Does this file already exist? Here is the error that was raised:
        ${error}
    `
    console.error(err)
    throw error
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('done!')
  }
}
