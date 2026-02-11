import generateFactoryContent from './generateFactoryContent.js'
import writeGeneratedFile from './writeGeneratedFile.js'

export default async function generateFactory({
  fullyQualifiedModelName,
  columnsWithTypes,
  modelClassName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  modelClassName: string
}) {
  await writeGeneratedFile({
    dreamPathKey: 'factories',
    fileName: `${fullyQualifiedModelName}Factory.ts`,
    content: generateFactoryContent({ fullyQualifiedModelName, columnsWithTypes, modelClassName }),
    logLabel: 'factory',
  })
}
