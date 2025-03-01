import * as fs from 'fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths'
import dreamPath from '../path/dreamPath'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import generateDreamContent from './generateDreamContent'
import generateFactory from './generateFactory'
import generateMigration from './generateMigration'
import generateSerializer from './generateSerializer'
import generateUnitSpec from './generateUnitSpec'

export default async function generateDream({
  fullyQualifiedModelName,
  columnsWithTypes,
  options,
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  options: { serializer: boolean }
  fullyQualifiedParentName?: string
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
        serializer: options.serializer,
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
    await generateSerializer({ fullyQualifiedModelName, columnsWithTypes, fullyQualifiedParentName })

  const isSTI = !!fullyQualifiedParentName
  if (columnsWithTypes.length || !isSTI) {
    await generateMigration({
      migrationName: fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedModelName,
      fullyQualifiedParentName,
    })
  }
}
