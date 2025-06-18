import serializerNameFromFullyQualifiedModelName from '../../serializer/helpers/serializerNameFromFullyQualifiedModelName.js'
import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import relativeDreamPath from '../path/relativeDreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

export default function generateSerializerContent({
  fullyQualifiedModelName,
  columnsWithTypes = [],
  fullyQualifiedParentName,
  stiBaseSerializer = false,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes?: string[] | undefined
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer?: boolean
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const additionalImports: string[] = []
  const dreamImports: string[] = []
  const stiChildSerializer = !!fullyQualifiedParentName

  if (stiChildSerializer) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    additionalImports.push(importStatementForSerializer(fullyQualifiedModelName, fullyQualifiedParentName))
  } else {
    dreamImports.push('DreamSerializer')
    if (stiBaseSerializer) dreamImports.push('DreamSerializerBuilder')
  }

  const relatedModelImport = importStatementForModel(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelInstanceName = camelize(modelClassName)
  const modelSerializerSignature = stiBaseSerializer
    ? `<T extends ${modelClassName}>(StiChildClass: typeof ${modelClassName}, ${modelInstanceName}: T)`
    : `(${modelInstanceName}: ${modelClassName})`
  const modelSerializerArgs = `${modelInstanceName}`
  const dreamSerializerArgs = `${stiBaseSerializer ? 'StiChildClass' : modelClassName}, ${modelInstanceName}`

  const serialzerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName)
  )

  const summarySerializerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName),
    'summary'
  )

  const nonGenericSerializerBuilderTypeCast = `as unknown as DreamSerializerBuilder<typeof ${modelClassName}, ${modelClassName}>`
  const genericSerializerBuilderTypeCast = stiBaseSerializer
    ? ` as unknown as DreamSerializerBuilder<typeof ${modelClassName}, T>`
    : ''

  const defaultSerializerExtends = stiChildSerializer
    ? `${serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!)
      )}(${modelClassName}, ${modelSerializerArgs})`
    : stiBaseSerializer
      ? `(${summarySerializerClassName}(${stiBaseSerializer ? 'StiChildClass, ' : ''}${modelSerializerArgs}) ${nonGenericSerializerBuilderTypeCast})`
      : `${summarySerializerClassName}(${modelSerializerArgs})`

  const summarySerializerExtends = stiChildSerializer
    ? `${serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!),
        'summary'
      )}(${modelClassName}, ${modelSerializerArgs})`
    : stiBaseSerializer
      ? `(DreamSerializer(${dreamSerializerArgs}) ${nonGenericSerializerBuilderTypeCast})`
      : `DreamSerializer(${dreamSerializerArgs})`

  const additionalModelImports: string[] = []

  const dreamImport = dreamImports.length
    ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  const additionalImportsStr = uniq(additionalImports).join('')

  return `${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}
export const ${summarySerializerClassName} = ${modelSerializerSignature} =>
  ${summarySerializerExtends}${stiChildSerializer ? '' : `\n    .attribute('id')${genericSerializerBuilderTypeCast}`}

export const ${serialzerClassName} = ${modelSerializerSignature} =>
  ${defaultSerializerExtends}${columnsWithTypes
    .map(attr => {
      const [name, type] = attr.split(':')
      if (name === undefined) return ''
      if (['belongs_to', 'has_one', 'has_many'].includes(type as any)) return ''

      return `\n    ${attribute(name, type, attr)}`
    })
    .join('\n\n  ')}${genericSerializerBuilderTypeCast}
`
}

function attribute(name: string, type: string | undefined, attr: string) {
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

  const importFrom = relativeDreamPath('serializers', 'serializers', originModelName, destinationModelName)

  return `import ${defaultSerializer}, { ${summarySerializer} } from '${importFrom}'\n`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  const modelName = globalClassNameFromFullyQualifiedModelName(destinationModelName)
  const importFrom = relativeDreamPath('serializers', 'models', originModelName, destinationModelName)

  return `import ${modelName} from '${importFrom}'\n`
}

function fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.replace(/\//g, '')
}
