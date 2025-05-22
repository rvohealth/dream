import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import relativeDreamPath from '../path/relativeDreamPath.js'
import serializerNameFromFullyQualifiedModelName from '../serializerNameFromFullyQualifiedModelName.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

export default function generateSerializerContent({
  fullyQualifiedModelName,
  columnsWithTypes = [],
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes?: string[] | undefined
  fullyQualifiedParentName?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const additionalImports: string[] = []
  let relatedModelImport = ''
  let modelClassName = ''
  let dataTypeCapture = ''
  const dreamImports: string[] = []
  let dreamSerializerTypeArgs = ''
  const isSTI = !!fullyQualifiedParentName

  if (isSTI) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    additionalImports.push(importStatementForSerializer(fullyQualifiedModelName, fullyQualifiedParentName))
  } else {
    dreamImports.push('Attribute')
    dreamImports.push('DreamColumn')
    dreamImports.push('DreamSerializer')
  }

  relatedModelImport = importStatementForModel(fullyQualifiedModelName)
  modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  dataTypeCapture = `<
  DataType extends ${modelClassName},
  Passthrough extends object,
>`
  dreamSerializerTypeArgs = `<DataType, Passthrough>`

  const defaultSerialzerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName)
  )

  const summarySerialzerClassName = serializerNameFromFullyQualifiedModelName(
    fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName),
    'summary'
  )

  const defaultSerialzerExtends = isSTI
    ? serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!)
      )
    : summarySerialzerClassName

  const summarySerialzerExtends = isSTI
    ? serializerNameFromFullyQualifiedModelName(
        fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!),
        'summary'
      )
    : 'DreamSerializer'

  const additionalModelImports: string[] = []
  columnsWithTypes.forEach(attr => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [name, type] = attr.split(':')

    switch (type) {
      case 'belongs_to':
      case 'has_one':
      case 'has_many':
        break

      default:
        dreamImports.push('Attribute')
        dreamImports.push('DreamColumn')
    }
  })

  let dreamImport = ''
  if (dreamImports.length) {
    dreamImport = `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'`
  }

  const additionalImportsStr = additionalImports.length ? uniq(additionalImports).join('') : ''

  return `\
${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}

export class ${summarySerialzerClassName}${dataTypeCapture} extends ${summarySerialzerExtends}${dreamSerializerTypeArgs} {
${
  isSTI
    ? ''
    : `  @Attribute(${modelClassName})
  public id: DreamColumn<${modelClassName}, 'id'>
`
}}

export default class ${defaultSerialzerClassName}${dataTypeCapture} extends ${defaultSerialzerExtends}${dreamSerializerTypeArgs} {
${columnsWithTypes
  .map(attr => {
    const [name, type] = attr.split(':')
    if (name === undefined) return ''

    const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(name)
    const associatedModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
    const propertyName = camelize(associatedModelName)

    switch (type) {
      case 'belongs_to':
      case 'has_one':
      case 'has_many':
        return ''

      default:
        return `  @Attribute(${modelClassName}${attributeOptionsSpecifier(type, attr)})
  public ${propertyName}: ${`DreamColumn<${modelClassName}, '${propertyName}'>`}`
    }
  })
  .join('\n\n  ')}
}
`
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

  return `\nimport ${defaultSerializer}, { ${summarySerializer} } from '${importFrom}'`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  const modelName = globalClassNameFromFullyQualifiedModelName(destinationModelName)
  const importFrom = relativeDreamPath('serializers', 'models', originModelName, destinationModelName)

  return `\nimport ${modelName} from '${importFrom}'`
}

function fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.split('/').at(-1) ?? ''
}
