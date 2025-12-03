import * as fs from 'node:fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath from '../path/dreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import generateFactoryContent from './generateFactoryContent.js'
import DreamCLI from '../../cli/index.js'

export default async function generateFactory({
  fullyQualifiedModelName,
  columnsWithTypes,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(
    dreamPath('factories'),
    `${fullyQualifiedModelName}Factory.ts`
  )

  try {
    DreamCLI.logger.log(`[dream] generating factory: ${relFilePath}`)

    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(absFilePath, generateFactoryContent({ fullyQualifiedModelName, columnsWithTypes }))
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the spec file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }
}
