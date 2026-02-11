import generateUnitSpecContent from './generateUnitSpecContent.js'
import writeGeneratedFile from './writeGeneratedFile.js'

export default async function generateUnitSpec({
  fullyQualifiedModelName,
}: {
  fullyQualifiedModelName: string
}) {
  await writeGeneratedFile({
    dreamPathKey: 'modelSpecs',
    fileName: `${fullyQualifiedModelName}.spec.ts`,
    content: generateUnitSpecContent({ fullyQualifiedModelName }),
    logLabel: 'spec',
  })
}
