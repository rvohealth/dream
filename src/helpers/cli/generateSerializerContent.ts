import pluralize from 'pluralize'
import camelize from '../camelize'
import initializeDream from '../initializeDream'
import pascalize from '../pascalize'
import relativeDreamPath from '../path/relativeDreamPath'
import uniq from '../uniq'

export default async function generateSerializerContent(
  nonStandardFullyQualifiedModelName?: string,
  attributes: string[] = []
) {
  const fullyQualifiedModelName: string = pascalize(nonStandardFullyQualifiedModelName)!
  await initializeDream()

  const serializerClass = serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const serializerSummaryClass = summarySerializerNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const additionalImports: string[] = []
  let relatedModelImport = ''
  let modelClass = ''
  let dataTypeCapture = ''
  let dreamSerializerTypeArgs = ''
  const dreamImports = ['DreamSerializer', 'Attribute']
  let extendedClass = 'DreamSerializer'

  if (fullyQualifiedModelName) {
    relatedModelImport = await importStatementForModel(fullyQualifiedModelName)
    modelClass = modelNameFromFullyQualifiedModelName(fullyQualifiedModelName)
    dataTypeCapture = `<
  DataType extends ${modelClass},
  Passthrough extends object
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
  for (const attr of attributes) {
    const [name, type] = attr.split(':')
    if (['belongs_to', 'has_one', 'has_many'].includes(type)) {
      const fullyQualifiedAssociatedModelName = pascalize(name)
      additionalModelImports.push(
        `\nimport ${modelNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)} from '${await relativeDreamPath('serializers', 'models', fullyQualifiedModelName, fullyQualifiedAssociatedModelName)}'`
      )
    }
  }

  const enumImports: string[] = []
  attributes.forEach(attr => {
    const [name, type] = attr.split(':')
    if (type === 'enum') enumImports.push(name)
  })

  const additionalImportsStr = additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  const enumImportsStr = enumImports.length
    ? enumValueImportStatements(fullyQualifiedModelName, uniq(enumImports))
    : ''

  let summarySerializer = ''
  if (modelClass) {
    summarySerializer = `

export class ${extendedClass}${dataTypeCapture} extends DreamSerializer${dreamSerializerTypeArgs} {
  @Attribute('string')
  public id: DreamColumn<${modelClass}, 'id'>
}`
  }

  return `\
${luxonImport}import { ${dreamImports.join(
    ', '
  )} } from '@rvohealth/dream'${additionalImportsStr}${enumImportsStr}${relatedModelImport}${additionalModelImports.join('')}${summarySerializer}

export default class ${serializerClass}${dataTypeCapture} extends ${extendedClass}${dreamSerializerTypeArgs} {
  ${attributes
    .map(attr => {
      const [name, type] = attr.split(':')
      const propertyName = camelize(name)
      const className = modelNameFromFullyQualifiedModelName(pascalize(name))

      switch (type) {
        case 'belongs_to':
        case 'has_one':
          return `@RendersOne(() => ${className})
  public ${camelize(className)}: ${className}`

        case 'has_many':
          return `@RendersMany(() => ${className})
  public ${pluralize(camelize(className))}: ${className}[]`

        default:
          return `@Attribute(${attributeSpecifier(type)}${attributeOptionsSpecifier(type, attr)})
  public ${propertyName}: ${jsType(type, attr, propertyName, modelClass)}`
      }
    })
    .join('\n\n  ')}
}\
`
}

function attributeSpecifier(type: string) {
  switch (type) {
    case 'date':
      return "'date'"

    case 'datetime':
    case 'time':
    case 'time_with_time_zone':
    case 'timestamp':
    case 'timestamp_with_time_zone':
    case 'timestamp_without_time_zone':
      return "'datetime'"

    case 'decimal':
      return "'decimal'"

    case 'jsonb':
    case 'json':
      return "'json'"

    case 'enum':
      return ''

    case 'integer':
    case 'double':
    case 'numeric':
    case 'real':
    case 'smallint':
    case 'smallserial':
    case 'serial':
      return "'number'"

    case 'bigint':
    case 'bigserial':
    case 'uuid':
    case 'text':
    case 'box':
    case 'bit':
    case 'bitvarying':
    case 'varbit':
    case 'bytea':
    case 'char':
    case 'character':
    case 'varchar':
    case 'character_varying':
    case 'cidr':
    case 'circle':
    case 'citext':
    case 'inet':
    case 'interval':
    case 'line':
    case 'lseg':
    case 'macaddr':
    case 'money':
    case 'path':
    case 'point':
    case 'polygon':
    case 'tsquery':
    case 'tsvector':
    case 'txid_snapshot':
    case 'xml':
      return "'string'"

    default:
      return type ? `'${type}'` : ''
  }
}

function attributeOptionsSpecifier(type: string, attr: string) {
  switch (type) {
    case 'decimal':
      return `, { precision: ${attr.split(',').pop()} }`

    case 'enum':
      return `{ type: 'string', enum: ${originalAttributeToEnumValuesName(attr)} }`

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

// Deprecate classNameFromRawStr once dream models have been rebuilt to use fully-qualified class names.
function modelNameFromFullyQualifiedModelName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.split('/').pop()!
}

function serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName: string) {
  return `${fullyQualifiedModelName}Serializer`.replace(/\//g, '')
}

function summarySerializerNameFromFullyQualifiedModelName(fullyQualifiedModelName: string) {
  return serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName).replace(
    /Serializer$/,
    'SummarySerializer'
  )
}

function originalAttributeToEnumValuesName(originalAttribute: string) {
  return attributeNameToEnumValuesName(originalAttribute.split(':')[2])
}

function attributeNameToEnumValuesName(name: string) {
  return `${pascalize(name)}EnumValues`
}

function hasJsType(attributes: string[], expectedType: 'DateTime' | 'CalendarDate') {
  return !!attributes
    .map(attr => {
      const [name] = attr.split(':')
      return jsType(name, attr, camelize(name))
    })
    .find(a => a === expectedType)
}

function pathToDbSyncFromSerializer(fullyQualifiedModelName: string) {
  const numAdditionalUpdirs = fullyQualifiedModelName.split('/').length - 1
  let additionalUpdirs = ''

  for (let i = 0; i < numAdditionalUpdirs; i++) {
    additionalUpdirs = `../${additionalUpdirs}`
  }
  return `${additionalUpdirs}../../db/sync`
}

async function importStatementForModel(fullyQualifiedModelName: string) {
  return `\nimport ${modelNameFromFullyQualifiedModelName(fullyQualifiedModelName)} from '${await relativeDreamPath('serializers', 'models', fullyQualifiedModelName)}'`
}

function enumValueImportStatements(fullyQualifiedModelName: string, enumNames: string[]) {
  return `\nimport { ${enumNames.map(enumName => attributeNameToEnumValuesName(enumName)).join(', ')} } from '${pathToDbSyncFromSerializer(
    fullyQualifiedModelName
  )}'`
}
