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
  includeInternalSerializers?: boolean
  tableName?: string | undefined
  modelName?: string | undefined
  /**
   * When true (and the generated model is NOT an STI child), decorates the
   * model with `@SoftDelete()` and auto-emits a nullable `deleted_at`
   * column in the migration and a `deletedAt` field on the model. Defaults
   * to false at this level — the CLI layer opts users in by default and
   * allows opt-out via `--no-soft-delete`.
   */
  softDelete?: boolean
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
  const isSTI = !!fullyQualifiedParentName
  // `@SoftDelete()` is incompatible with STI children, so we force-disable
  // the soft-delete scaffold when generating an STI child regardless of the
  // caller-provided value.
  const softDelete = !isSTI && !!options.softDelete

  await writeGeneratedFile({
    dreamPathKey: 'models',
    fileName: `${fullyQualifiedModelName}.ts`,
    content: generateDreamContent({
      fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedParentName,
      serializer: options.serializer,
      includeAdminSerializers: options.includeAdminSerializers,
      includeInternalSerializers: options.includeInternalSerializers ?? false,
      connectionName: options.connectionName,
      tableName: options.tableName,
      modelClassName,
      softDelete,
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
      includeInternalSerializers: options.includeInternalSerializers ?? false,
      modelClassName,
    })

  if (columnsWithTypes.length || !isSTI) {
    await generateMigration({
      connectionName: options.connectionName,
      migrationName: `Create${fullyQualifiedModelName}`,
      columnsWithTypes,
      fullyQualifiedModelName,
      fullyQualifiedParentName,
      tableName: options.tableName,
      modelClassName,
      softDelete,
    })
  }
}
