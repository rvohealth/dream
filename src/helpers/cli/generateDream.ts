import pluralize from 'pluralize'
import fs from 'fs/promises'
import generateDreamContent from './generateDreamContent'
import generateMigrationContent from './generateMigrationContent'
import generateSerializerContent from './generateSerializerContent'
import migrationVersion from '../migrationVersion'
import { loadDreamYamlFile, migrationsPath, modelsPath } from '../path'
import hyphenize from '../hyphenize'
import snakeify from '../snakeify'
import pascalize from '../pascalize'
import generateUnitSpec from './generateUnitSpec'
import serializersPath from '../path/serializersPath'
import path from 'path'
import primaryKeyType from '../db/primaryKeyType'
import generateFactory from './generateFactory'
import pascalizePath from '../pascalizePath'
import relativeDreamPath from '../path/relativeDreamPath'

export default async function generateDream(dreamName: string, attributes: string[]) {
  const ymlConfig = await loadDreamYamlFile()

  const dreamBasePath = await modelsPath()
  const formattedDreamName = pluralize
    .singular(dreamName)
    .split('/')
    .map(pathName => pascalize(pathName))
    .join('/')
  const dreamPath = path.join(dreamBasePath, `${formattedDreamName}.ts`)
  const relativeModelsPath = dreamPath.replace(dreamBasePath, ymlConfig.models_path || 'app/models')
  const dreamPathParts = formattedDreamName.split('/')
  const thisfs = fs ? fs : await import('fs/promises')

  // if they are generating a nested model path,
  // we need to make sure the nested directories exist
  if (dreamPathParts.length) {
    const fullPath = [...dreamBasePath.split('/'), ...dreamPathParts].slice(0, -1).join('/')
    await thisfs.mkdir(fullPath, { recursive: true })
  }

  const content = await generateDreamContent(dreamName, attributes)

  try {
    console.log(`generating dream: ${relativeModelsPath}`)
    await thisfs.writeFile(dreamPath, content)
  } catch (error) {
    const err = `
      Something happened while trying to create the dream file:
        ${dreamPath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `
    console.error(err)
    console.error(error)
    console.trace()
    throw error
  }

  await generateUnitSpec(dreamName, 'models')
  await generateFactory(dreamName, attributes)

  const migrationBasePath = await migrationsPath()
  const version = migrationVersion()
  const migrationPath = `${migrationBasePath}/${version}-create-${pluralize(hyphenize(dreamName)).replace(/\//g, '-')}.ts`
  const migrationsRelativeBasePath = path.join(await relativeDreamPath('db'), 'migrations')
  const relativeMigrationPath = migrationPath.replace(
    new RegExp(`^.*${migrationsRelativeBasePath}`),
    migrationsRelativeBasePath
  )

  const finalContent = generateMigrationContent({
    table: snakeify(pluralize(pascalizePath(dreamName))),
    attributes,
    primaryKeyType: primaryKeyType(),
  })
  try {
    console.log(`generating migration: ${relativeMigrationPath}`)
    await thisfs.writeFile(migrationPath, finalContent)
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

  const serializerBasePath = await serializersPath()
  const fullyQualifiedSerializerName =
    pluralize
      .singular(dreamName)
      .split('/')
      .map(pathName => pascalize(pathName))
      .join('/') + 'Serializer'
  const serializerPath = path.join(serializerBasePath, `${fullyQualifiedSerializerName}.ts`)

  const relativeSerializerBasePath = await relativeDreamPath('serializers')
  const relativeSerializerPath = serializerPath.replace(
    new RegExp(`^.*${relativeSerializerBasePath}`),
    relativeSerializerBasePath
  )

  const serializerPathParts = fullyQualifiedSerializerName.split('/')

  if (serializerPathParts.length) {
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
        ${(error as Error).message}
    `
    console.error(err)
    throw error
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('done!')
  }
}
