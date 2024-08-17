import pluralize from 'pluralize'
import camelize from '../camelize'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName'
import pascalize from '../pascalize'
import relativeDreamPath from '../path/relativeDreamPath'
import serializerNameFromFullyQualifiedModelName from '../serializerNameFromFullyQualifiedModelName'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import uniq from '../uniq'

export default function generateSerializerContent(
  fullyQualifiedModelName: string,
  attributes: string[] = []
) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const serializerClass = globalClassNameFromFullyQualifiedModelName(
    serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  )
  const serializerSummaryClass = globalClassNameFromFullyQualifiedModelName(
    serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName, 'summary')
  )
  const additionalImports: string[] = []
  let relatedModelImport = ''
  let modelClass = ''
  let dataTypeCapture = ''
  let dreamSerializerTypeArgs = ''
  const dreamImports = ['DreamSerializer', 'Attribute']
  let extendedClass = 'DreamSerializer'

  if (fullyQualifiedModelName) {
    relatedModelImport = importStatementForModel(fullyQualifiedModelName)
    modelClass = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
    dataTypeCapture = `<
  DataType extends ${modelClass},
  Passthrough extends object,
>`
    dreamSerializerTypeArgs = `<DataType, Passthrough>`
    dreamImports.push('DreamColumn')
    extendedClass = serializerSummaryClass
  }

  let luxonImport = ''
  if (!modelClass) {
    luxonImport = hasJsType(attributes, 'DateTime') ? "import { DateTime } from 'luxon'\n" : ''
    if (hasJsType(attributes, 'CalendarDate')) dreamImports.push('CalendarDate')
  }

  if (attributes.find(attr => /:belongs_to|:has_one/.test(attr))) dreamImports.push('RendersOne')
  if (attributes.find(attr => /:has_many/.test(attr))) dreamImports.push('RendersMany')

  const additionalModelImports: string[] = []
  attributes.forEach(attr => {
    const [name, type] = attr.split(':')
    if (['belongs_to', 'has_one', 'has_many'].includes(type)) {
      const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(name)
      additionalModelImports.push(
        importStatementForModel(fullyQualifiedModelName, fullyQualifiedAssociatedModelName)
      )
    }
  })

  const additionalImportsStr = additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''

  let summarySerializer = ''
  if (modelClass) {
    summarySerializer = `

export class ${extendedClass}${dataTypeCapture} extends DreamSerializer${dreamSerializerTypeArgs} {
  @Attribute(${modelClass})
  public id: DreamColumn<${modelClass}, 'id'>
}`
  }

  return `\
${luxonImport}import { ${dreamImports.join(
    ', '
  )} } from '@rvohealth/dream'${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}${summarySerializer}

export default class ${serializerClass}${dataTypeCapture} extends ${extendedClass}${dreamSerializerTypeArgs} {
  ${attributes
    .map(attr => {
      const [name, type] = attr.split(':')
      const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(name)
      const associatedModelName = globalClassNameFromFullyQualifiedModelName(
        fullyQualifiedAssociatedModelName
      )
      const propertyName = camelize(associatedModelName)

      switch (type) {
        case 'belongs_to':
        case 'has_one':
          return `@RendersOne( ${associatedModelName})
  public ${propertyName}: ${associatedModelName}`

        case 'has_many':
          return `@RendersMany( ${associatedModelName})
  public ${pluralize(propertyName)}: ${associatedModelName}[]`

        default:
          return `@Attribute(${modelClass}${attributeOptionsSpecifier(type, attr)})
  public ${propertyName}: ${jsType(type, attr, propertyName, modelClass)}`
      }
    })
    .join('\n\n  ')}
}
`
}

function attributeOptionsSpecifier(type: string, attr: string) {
  switch (type) {
    case 'decimal':
      return `, null, { precision: ${attr.split(',').pop()} }`

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

function hasJsType(attributes: string[], expectedType: 'DateTime' | 'CalendarDate') {
  return !!attributes
    .map(attr => {
      const [name] = attr.split(':')
      return jsType(name, attr, camelize(name))
    })
    .find(a => a === expectedType)
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativeDreamPath('serializers', 'models', originModelName, destinationModelName)}'`
}
