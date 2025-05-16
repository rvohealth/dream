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
  const modelSerializerSignature = stiBaseSerializer
    ? `StiChildClass: typeof ${modelClassName}, data: ${modelClassName}, passthroughData: object`
    : `data: ${modelClassName}, passthroughData: object`
  const modelSerializerArgs = stiBaseSerializer
    ? `StiChildClass, data, passthroughData`
    : isSTI
      ? `${modelClassName}, data, passthroughData`
      : `data, passthroughData`
  const dreamSerializerArgs = stiBaseSerializer
    ? `StiChildClass, data, passthroughData`
    : `${modelClassName}, data, passthroughData`

  // const defaultSerialzerClassName = serializerNameFromFullyQualifiedModelName(
  //   fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName)
  // )

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
      )}(${dreamSerializerArgs})`
    : `DreamSerializer(${dreamSerializerArgs})`

  const additionalModelImports: string[] = []

  const dreamImport = dreamImports.length
    ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  const additionalImportsStr = uniq(additionalImports).join('')

  return `${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}
export const ${summarySerialzerClassName} = (${modelSerializerSignature}) =>
  ${summarySerialzerExtends}${isSTI ? '' : `\n    .attribute('id')`}

export default (${modelSerializerSignature}) =>
  ${defaultSerialzerExtends}${columnsWithTypes
    .map(attr => {
      const [name, type] = attr.split(':')
      if (name === undefined) return ''
      if (['belongs_to', 'has_one', 'has_many'].includes(type as any)) return ''

      return `\n    .attribute('${camelize(name)}'${attributeOptionsSpecifier(type, attr)})`
    })
    .join('\n\n  ')}
`
}

function attributeOptionsSpecifier(type: string | undefined, attr: string) {
  switch (type) {
    case 'decimal':
      return `, { precision: ${attr.split(',').pop()} }`

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
  return fullyQualifiedModelName.split('/').pop() ?? ''
}
