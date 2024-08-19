import fs from 'fs/promises'
import path from 'path'
import pluralize from 'pluralize'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'
import primaryKeyType from '../db/primaryKeyType'
import hyphenize from '../hyphenize'
import migrationVersion from '../migrationVersion'
import pascalize from '../pascalize'
import pascalizePath from '../pascalizePath'
import dreamPath from '../path/dreamPath'
import snakeify from '../snakeify'
import generateDreamContent from './generateDreamContent'
import generateFactory from './generateFactory'
import generateMigrationContent from './generateMigrationContent'
import generateSerializerContent from './generateSerializerContent'
import generateUnitSpec from './generateUnitSpec'

export default async function generateDream(dreamName: string, attributes: string[], parentName?: string) {
  const isSTI = !!parentName
  const dreamApp = getCachedDreamApplicationOrFail()

  const dreamBasePath = path.join(dreamApp.appRoot, dreamApp.paths.models)
  const formattedDreamName = pluralize
    .singular(dreamName)
    .split('/')
    .map(pathName => pascalize(pathName))
    .join('/')
  const dreamPathString = path.join(dreamBasePath, `${formattedDreamName}.ts`)
  const relativeModelsPath = dreamPathString.replace(dreamBasePath, dreamApp.paths.models)
  const dreamPathParts = formattedDreamName.split('/')

  // if they are generating a nested model path,
  // we need to make sure the nested directories exist
  if (dreamPathParts.length) {
    const fullPath = [...dreamBasePath.split('/'), ...dreamPathParts].slice(0, -1).join('/')
    await fs.mkdir(fullPath, { recursive: true })
  }

  const content = generateDreamContent(dreamName, attributes, parentName)

  try {
    console.log(`generating dream: ${relativeModelsPath}`)
    await fs.writeFile(dreamPathString, content)
  } catch (error) {
    const err = `
      Something happened while trying to create the dream file:
        ${dreamPathString}

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

  if (!isSTI) {
    // generate migration file
    const migrationBasePath = path.join(dreamApp.appRoot, dreamApp.paths.db, 'migrations')
    const version = migrationVersion()
    const migrationPath = `${migrationBasePath}/${version}-create-${pluralize(hyphenize(dreamName)).replace(/\//g, '-')}.ts`
    const migrationsRelativeBasePath = path.join(dreamPath('db'), 'migrations')
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
      await fs.writeFile(migrationPath, finalContent)
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
    // end: generate migration file
  }

  const serializerBasePath = path.join(dreamApp.appRoot, dreamApp.paths.serializers)
  const fullyQualifiedSerializerName =
    pluralize
      .singular(dreamName)
      .split('/')
      .map(pathName => pascalize(pathName))
      .join('/') + 'Serializer'
  const serializerPath = path.join(serializerBasePath, `${fullyQualifiedSerializerName}.ts`)

  const relativeSerializerBasePath = dreamPath('serializers')
  const relativeSerializerPath = serializerPath.replace(
    new RegExp(`^.*${relativeSerializerBasePath}`),
    relativeSerializerBasePath
  )

  const serializerPathParts = fullyQualifiedSerializerName.split('/')

  if (serializerPathParts.length) {
    const fullSerializerPath = [...serializerBasePath.split('/'), ...serializerPathParts.slice(0, -1)].join(
      '/'
    )
    await fs.mkdir(fullSerializerPath, { recursive: true })
  }

  try {
    console.log(`generating serializer: ${relativeSerializerPath}`)
    await fs.writeFile(serializerPath, generateSerializerContent(dreamName, attributes, parentName))
  } catch (error) {
    const err = `
      Something happened while trying to create the serializer file:
        ${dreamPathString}

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
