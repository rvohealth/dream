import generateSerializerContent from './generateSerializerContent.js'
import writeGeneratedFile from './writeGeneratedFile.js'

export default async function generateSerializer({
  fullyQualifiedModelName,
  columnsWithTypes,
  fullyQualifiedParentName,
  stiBaseSerializer,
  includeAdminSerializers,
  modelClassName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  modelClassName: string
}) {
  await writeGeneratedFile({
    dreamPathKey: 'serializers',
    fileName: `${fullyQualifiedModelName}Serializer.ts`,
    content: generateSerializerContent({
      fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedParentName,
      stiBaseSerializer,
      includeAdminSerializers,
      modelClassName,
    }),
    logLabel: 'serializer',
  })
}
