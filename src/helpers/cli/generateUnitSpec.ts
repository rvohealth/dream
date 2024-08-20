import fs from 'fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths'
import dreamPath from '../path/dreamPath'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import generateUnitSpecContent from './generateUnitSpecContent'

export default async function generateUnitSpec(fullyQualifiedModelName: string) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(
    dreamPath('modelSpecs'),
    `${fullyQualifiedModelName}.spec.ts`
  )

  try {
    console.log(`generating spec: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(absFilePath, generateUnitSpecContent(fullyQualifiedModelName))
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the spec file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }
}
