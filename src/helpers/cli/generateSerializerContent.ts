import serializerNameFromFullyQualifiedModelName from '../../serializer/helpers/serializerNameFromFullyQualifiedModelName.js'
import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import absoluteDreamPath from '../path/absoluteDreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

export default function generateSerializerContent({
  fullyQualifiedModelName,
  columnsWithTypes = [],
  fullyQualifiedParentName,
  stiBaseSerializer,
  includeAdminSerializers,
  modelClassName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes?: string[] | undefined
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  /** Model class name, computed once via modelClassNameFrom in the orchestrator. */
  modelClassName: string
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const additionalImports: string[] = []
  const dreamImports: string[] = []
  const isSTI = !!fullyQualifiedParentName

  if (isSTI) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    additionalImports.push(importStatementForSerializer(fullyQualifiedModelName, fullyQualifiedParentName))
  } else {
    dreamImports.push('DreamSerializer')
  }

  const relatedModelImport = importStatementForModel(fullyQualifiedModelName)
  const modelInstanceName = camelize(modelClassName)
  const modelSerializerSignature = stiBaseSerializer
    ? `<T extends ${modelClassName}>(StiChildClass: typeof ${modelClassName}, ${modelInstanceName}: T)`
    : `(${modelInstanceName}: ${modelClassName})`
  const modelSerializerArgs = `${modelInstanceName}`
  const dreamSerializerArgs = `${stiBaseSerializer ? `StiChildClass ?? ${modelClassName}` : modelClassName}, ${modelInstanceName}`

  const serializerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName)
  )

  const summarySerializerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName),
    'summary'
  )

  const defaultSerializerExtends = isSTI
    ? `${serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!)
      )}(${modelClassName}, ${modelSerializerArgs})`
    : `${summarySerializerClassName}(${stiBaseSerializer ? 'StiChildClass, ' : ''}${modelSerializerArgs})`

  const summarySerializerExtends = isSTI
    ? `${serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!),
        'summary'
      )}(${modelClassName}, ${modelSerializerArgs})`
    : `DreamSerializer(${dreamSerializerArgs})`

  // Admin variants
  const adminSerializerClassName = serializerClassName.replace(/Serializer$/, 'AdminSerializer')

  const adminSummarySerializerClassName = summarySerializerClassName.replace(
    /SummarySerializer$/,
    'AdminSummarySerializer'
  )
  // end:Admin variants

  const additionalModelImports: string[] = []

  const dreamImport = dreamImports.length
    ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  const additionalImportsStr = uniq(additionalImports).join('')

  const summarySerializer = `export const ${summarySerializerClassName} = ${modelSerializerSignature} =>
  ${summarySerializerExtends}${isSTI ? '' : `\n    .attribute('id')`}`

  const defaultSerializer = `export const ${serializerClassName} = ${modelSerializerSignature} =>
  ${defaultSerializerExtends}${columnsWithTypes
    .map(attr => {
      const [name, type] = attr.split(':')
      if (name === undefined) return ''
      if (['belongsto', 'hasone', 'hasmany'].includes(camelize(type as any)?.toLowerCase())) return ''

      return `\n    ${attribute(modelClassName, name, type, attr, stiBaseSerializer)}`
    })
    .join('')}`

  return `${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}
${summarySerializer}

${defaultSerializer}${
    !includeAdminSerializers
      ? ''
      : `

${summarySerializer.replace(summarySerializerClassName, adminSummarySerializerClassName)}

${defaultSerializer.replace(serializerClassName, adminSerializerClassName).replace(summarySerializerClassName, adminSummarySerializerClassName)}`
  }
`
}

function attribute(
  modelClassName: string,
  name: string,
  type: string | undefined,
  attr: string,
  stiBaseSerializer: boolean
) {
  if (name === 'type' && stiBaseSerializer) {
    return `.attribute('type', { openapi: { type: 'string', enum: [(StiChildClass ?? ${modelClassName}).sanitizedName] } })`
  }

  switch (type) {
    case 'json':
    case 'jsonb':
    case 'json[]':
    case 'jsonb[]':
      return `.attribute('${camelize(name)}', { openapi: { type: 'object', properties: { } } })`

    default:
      return `.attribute('${camelize(name)}'${attributeOptionsSpecifier(type, attr)})`
  }
}

function attributeOptionsSpecifier(type: string | undefined, attr: string) {
  switch (type) {
    case 'decimal':
      return `, { precision: ${attr.split(',').at(-1)} }`

    default:
      return ''
  }
}

function importStatementForSerializer(originModelName: string, destinationModelName: string) {
  const defaultSerializer = globalClassNameFromFullyQualifiedModelName(
    serializerNameFromFullyQualifiedModelName(
      fullyQualifiedModelNameToSerializerBaseName(destinationModelName)
    )
  )

  const summarySerializer = globalClassNameFromFullyQualifiedModelName(
    serializerNameFromFullyQualifiedModelName(
      fullyQualifiedModelNameToSerializerBaseName(destinationModelName),
      'summary'
    )
  )

  const importFrom = absoluteDreamPath('serializers', destinationModelName)

  return `import { ${defaultSerializer}, ${summarySerializer} } from '${importFrom}'\n`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  const modelName = globalClassNameFromFullyQualifiedModelName(destinationModelName)
  const importFrom = absoluteDreamPath('models', destinationModelName)

  return `import ${modelName} from '${importFrom}'\n`
}

function fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.replace(/\//g, '')
}
