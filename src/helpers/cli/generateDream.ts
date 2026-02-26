import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import generateDreamContent from './generateDreamContent.js'
import generateFactory from './generateFactory.js'
import generateMigration from './generateMigration.js'
import generateSerializer from './generateSerializer.js'
import generateUnitSpec from './generateUnitSpec.js'
import modelClassNameFrom from './modelClassNameFrom.js'
import writeGeneratedFile from './writeGeneratedFile.js'

export interface GenerateDreamOptions {
  connectionName: string
  serializer: boolean
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  tableName?: string | undefined
  modelName?: string | undefined
}

export default async function generateDream({
  fullyQualifiedModelName,
  columnsWithTypes,
  options,
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  options: GenerateDreamOptions
  fullyQualifiedParentName?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = modelClassNameFrom(fullyQualifiedModelName, options.modelName)

  await writeGeneratedFile({
    dreamPathKey: 'models',
    fileName: `${fullyQualifiedModelName}.ts`,
    content: generateDreamContent({
      fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedParentName,
      serializer: options.serializer,
      includeAdminSerializers: options.includeAdminSerializers,
      connectionName: options.connectionName,
      tableName: options.tableName,
      modelClassName,
    }),
    logLabel: 'dream',
  })

  await generateUnitSpec({ fullyQualifiedModelName })
  await generateFactory({ fullyQualifiedModelName, columnsWithTypes, modelClassName })
  if (options.serializer)
    await generateSerializer({
      fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedParentName,
      stiBaseSerializer: options.stiBaseSerializer,
      includeAdminSerializers: options.includeAdminSerializers,
      modelClassName,
    })

  const isSTI = !!fullyQualifiedParentName
  if (columnsWithTypes.length || !isSTI) {
    await generateMigration({
      connectionName: options.connectionName,
      migrationName: `Create${fullyQualifiedModelName}`,
      columnsWithTypes,
      fullyQualifiedModelName,
      fullyQualifiedParentName,
      tableName: options.tableName,
      modelClassName,
    })
  }
}
