import * as fs from 'node:fs/promises'
import DreamCLI from '../../cli/index.js'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath from '../path/dreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import generateSerializerContent from './generateSerializerContent.js'

export default async function generateSerializer({
  fullyQualifiedModelName,
  columnsWithTypes,
  fullyQualifiedParentName,
  stiBaseSerializer,
  includeAdminSerializers,
  modelName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  /** When set, overrides the generated class name e.g., `pnpm psy g:model --model-name=GroupSession Session/Group`. */
  modelName?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(
    dreamPath('serializers'),
    `${fullyQualifiedModelName}Serializer.ts`
  )

  try {
    DreamCLI.logger.log(`[dream] generating serializer: ${relFilePath}`)

    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      generateSerializerContent({
        fullyQualifiedModelName,
        columnsWithTypes,
        fullyQualifiedParentName,
        stiBaseSerializer,
        includeAdminSerializers,
        modelName,
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
