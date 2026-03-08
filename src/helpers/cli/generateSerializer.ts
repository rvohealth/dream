import generateSerializerContent from './generateSerializerContent.js'
import writeGeneratedFile from './writeGeneratedFile.js'

export default async function generateSerializer({
  fullyQualifiedModelName,
  columnsWithTypes,
  fullyQualifiedParentName,
  stiBaseSerializer,
  includeAdminSerializers,
  includeInternalSerializers,
  modelClassName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  includeInternalSerializers?: boolean
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
      includeInternalSerializers: includeInternalSerializers ?? false,
      modelClassName,
    }),
    logLabel: 'serializer',
  })
}
