import * as fs from 'node:fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath from '../path/dreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import generateSerializerContent from './generateSerializerContent.js'

export default async function generateSerializer({
  fullyQualifiedModelName,
  columnsWithTypes,
  fullyQualifiedParentName,
  stiBaseSerializer,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer: boolean
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(
    dreamPath('serializers'),
    `${fullyQualifiedModelName}Serializer.ts`
  )

  try {
    console.log(`generating serializer: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      generateSerializerContent({
        fullyQualifiedModelName,
        columnsWithTypes,
        fullyQualifiedParentName,
        stiBaseSerializer,
      })
    )
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the serializer file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }
}
