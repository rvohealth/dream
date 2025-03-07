import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import pascalize from '../pascalize.js'
import relativeDreamPath from '../path/relativeDreamPath.js'
import serializerNameFromFullyQualifiedModelName from '../serializerNameFromFullyQualifiedModelName.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq'

export default function generateSerializerContent({
  fullyQualifiedModelName,
  columnsWithTypes = [],
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes?: string[]
  fullyQualifiedParentName?: string
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

  const defaultSerialzerClassName = globalClassNameFromFullyQualifiedModelName(
    serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  )

  const summarySerialzerClassName = globalClassNameFromFullyQualifiedModelName(
    serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName, 'summary')
  )

  const defaultSerialzerExtends = isSTI
    ? globalClassNameFromFullyQualifiedModelName(
        serializerNameFromFullyQualifiedModelName(fullyQualifiedParentName!)
      )
    : summarySerialzerClassName

  const summarySerialzerExtends = isSTI
    ? globalClassNameFromFullyQualifiedModelName(
        serializerNameFromFullyQualifiedModelName(fullyQualifiedParentName!, 'summary')
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
    dreamImport = `import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'`
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
  public ${propertyName}: ${jsType(type, attr, propertyName, modelClassName)}`
    }
  })
  .join('\n\n  ')}
}
`
}

function attributeOptionsSpecifier(type: string, attr: string) {
  switch (type) {
    case 'decimal':
      return `, { precision: ${attr.split(',').pop()} }`

    default:
      return ''
  }
}

function jsType(
  type: string,
  originalAttribute: string,
  propertyName: string,
  modelClass: string | null = null
) {
  if (modelClass) return `DreamColumn<${modelClass}, '${propertyName}'>`

  switch (type) {
    case 'date':
      return 'CalendarDate'

    case 'datetime':
      return 'DateTime'

    case 'decimal':
    case 'integer':
    case 'number':
      return 'number'

    case 'string':
    case 'text':
    case 'bigint':
    case 'uuid':
      return 'string'

    case 'enum':
      return pascalize(originalAttribute.split(':')[2]) + 'Enum'

    default:
      return 'any'
  }
}

function importStatementForSerializer(originModelName: string, destinationModelName: string) {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(serializerNameFromFullyQualifiedModelName(destinationModelName))}, { ${globalClassNameFromFullyQualifiedModelName(serializerNameFromFullyQualifiedModelName(destinationModelName, 'summary'))} } from '${relativeDreamPath('serializers', 'serializers', originModelName, destinationModelName)}'`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativeDreamPath('serializers', 'models', originModelName, destinationModelName)}'`
}
