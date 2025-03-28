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
      return `, { precision: ${attr.split(',').pop()} }`

    default:
      return ''
  }
}

function importStatementForSerializer(originModelName: string, destinationModelName: string) {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(serializerNameFromFullyQualifiedModelName(destinationModelName))}, { ${globalClassNameFromFullyQualifiedModelName(serializerNameFromFullyQualifiedModelName(destinationModelName, 'summary'))} } from '${relativeDreamPath('serializers', 'serializers', originModelName, destinationModelName)}'`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativeDreamPath('serializers', 'models', originModelName, destinationModelName)}'`
}
