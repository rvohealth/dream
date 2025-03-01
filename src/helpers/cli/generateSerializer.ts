import * as fs from 'fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths'
import dreamPath from '../path/dreamPath'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import generateSerializerContent from './generateSerializerContent'

export default async function generateSerializer({
  fullyQualifiedModelName,
  columnsWithTypes,
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string
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
      generateSerializerContent({ fullyQualifiedModelName, columnsWithTypes, fullyQualifiedParentName })
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
