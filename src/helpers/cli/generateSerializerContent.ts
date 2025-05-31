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
  const isSTI = !!fullyQualifiedParentName

  if (isSTI) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    additionalImports.push(importStatementForSerializer(fullyQualifiedModelName, fullyQualifiedParentName))
  } else {
    dreamImports.push('DreamSerializer')
  }

  const relatedModelImport = importStatementForModel(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelInstanceName = camelize(modelClassName)
  const modelSerializerSignature = stiBaseSerializer
    ? `<T extends ${modelClassName}>(${modelInstanceName}: T)`
    : `(${modelInstanceName}: ${modelClassName})`
  const modelSerializerArgs = `${modelInstanceName}`
  const dreamSerializerArgs = `${modelClassName}, ${modelInstanceName}`

  const serialzerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName)
  )

  const summarySerialzerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName),
    'summary'
  )

  const defaultSerialzerExtends = isSTI
    ? `${serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!)
      )}(${modelSerializerArgs})`
    : `${summarySerialzerClassName}(${modelSerializerArgs})`

  const summarySerialzerExtends = isSTI
    ? `${serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!),
        'summary'
      )}(${modelSerializerArgs})`
    : `DreamSerializer(${dreamSerializerArgs})`

  const additionalModelImports: string[] = []

  const dreamImport = dreamImports.length
    ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  const additionalImportsStr = uniq(additionalImports).join('')

  return `${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}
export const ${summarySerialzerClassName} = ${modelSerializerSignature} =>
  ${summarySerialzerExtends}${isSTI ? '' : `\n    .attribute('id')`}

export const ${serialzerClassName} = ${modelSerializerSignature} =>
  ${defaultSerialzerExtends}${columnsWithTypes
    .map(attr => {
      const [name, type] = attr.split(':')
      if (name === undefined) return ''
      if (['belongs_to', 'has_one', 'has_many'].includes(type as any)) return ''

      return `\n    ${attribute(name, type, attr)}`
    })
    .join('\n\n  ')}
`
}

function attribute(name: string, type: string | undefined, attr: string) {
  switch (type) {
    case 'json':
    case 'jsonb':
    case 'json[]':
    case 'jsonb[]':
      return `.jsonAttribute('${camelize(name)}', { openapi: { type: 'object', properties: { } } })`

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

export function fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.replace(/\//g, '')
}
