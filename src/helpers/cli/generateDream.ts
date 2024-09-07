import fs from 'fs/promises'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths'
import dreamPath from '../path/dreamPath'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import generateDreamContent from './generateDreamContent'
import generateFactory from './generateFactory'
import generateMigration from './generateMigration'
import generateSerializer from './generateSerializer'
import generateUnitSpec from './generateUnitSpec'

export default async function generateDream(
  fullyQualifiedModelName: string,
  attributes: string[],
  options: { serializer: boolean },
  parentName?: string
) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(
    dreamPath('models'),
    `${fullyQualifiedModelName}.ts`
  )

  try {
    console.log(`generating dream: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(absFilePath, generateDreamContent(fullyQualifiedModelName, attributes, parentName))
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the Dream file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }

  await generateUnitSpec(fullyQualifiedModelName)
  await generateFactory(fullyQualifiedModelName, attributes)
  await generateSerializer(fullyQualifiedModelName, attributes, parentName)

  const isSTI = !!parentName
  if (attributes.length || !isSTI) {
    await generateMigration(fullyQualifiedModelName, attributes, fullyQualifiedModelName, parentName)
  }
}
