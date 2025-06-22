import * as fs from 'node:fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath from '../path/dreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import generateDreamContent from './generateDreamContent.js'
import generateFactory from './generateFactory.js'
import generateMigration from './generateMigration.js'
import generateSerializer from './generateSerializer.js'
import generateUnitSpec from './generateUnitSpec.js'

export default async function generateDream({
  fullyQualifiedModelName,
  columnsWithTypes,
  options,
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  options: {
    serializer: boolean
    stiBaseSerializer: boolean
    includeAdminSerializers: boolean
  }
  fullyQualifiedParentName?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(
    dreamPath('models'),
    `${fullyQualifiedModelName}.ts`
  )

  try {
    console.log(`generating dream: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      generateDreamContent({
        fullyQualifiedModelName,
        columnsWithTypes,
        fullyQualifiedParentName,
        serializer: options.serializer && !options.stiBaseSerializer,
        includeAdminSerializers: options.includeAdminSerializers,
      })
    )
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the Dream file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }

  await generateUnitSpec({ fullyQualifiedModelName })
  await generateFactory({ fullyQualifiedModelName, columnsWithTypes })
  if (options.serializer)
    await generateSerializer({
      fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedParentName,
      stiBaseSerializer: options.stiBaseSerializer,
      includeAdminSerializers: options.includeAdminSerializers,
    })

  const isSTI = !!fullyQualifiedParentName
  if (columnsWithTypes.length || !isSTI) {
    await generateMigration({
      migrationName: `Create${fullyQualifiedModelName}`,
      columnsWithTypes,
      fullyQualifiedModelName,
      fullyQualifiedParentName,
    })
  }
}
