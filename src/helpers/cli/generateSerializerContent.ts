import pluralize from 'pluralize'
import camelize from '../camelize'
import pascalize from '../pascalize'

export default async function generateSerializerContent(
  fullyQualifiedSerializerName: string,
  fullyQualifiedModelName?: string,
  attributes: string[] = []
) {
  const serializerClass = fullyQualifiedClassNameFromRawStr(fullyQualifiedSerializerName)
  let relatedModelImport = ''
  let modelClass = ''
  let typeArgs = ''
  if (fullyQualifiedModelName) {
    relatedModelImport = importStatementForModel(fullyQualifiedSerializerName, fullyQualifiedModelName)
    modelClass = classNameFromRawStr(fullyQualifiedModelName)
    typeArgs = `<${modelClass}>`
  }

  const luxonImport = hasDateTimeType(attributes) ? "import { DateTime } from 'luxon'\n" : ''

  const dreamImports = ['DreamSerializer', 'Attribute']
  if (attributes.find(attr => /:belongs_to|:has_one/.test(attr))) dreamImports.push('RendersOne')
  if (attributes.find(attr => /:has_many/.test(attr))) dreamImports.push('RendersMany')

  const additionalModelImports: string[] = []
  attributes.forEach(attr => {
    const [name, type] = attr.split(':')
    if (['belongs_to', 'has_one', 'has_many'].includes(type)) {
      additionalModelImports.push(importStatementForModel(fullyQualifiedSerializerName, name))
    }
  })

  return `\
${luxonImport}import { ${dreamImports.join(
    ', '
  )} } from 'dream'${relatedModelImport}${additionalModelImports.join('')}

export default class ${serializerClass} extends DreamSerializer${typeArgs} {
  ${attributes
    .map(attr => {
      const [name, type] = attr.split(':')
      switch (type) {
        case 'belongs_to':
        case 'has_one':
          return `@RendersOne()
  public ${camelize(classNameFromRawStr(name))}: ${classNameFromRawStr(name)}`

        case 'has_many':
          return `@RendersMany()
  public ${pluralize(camelize(classNameFromRawStr(name)))}: ${classNameFromRawStr(name)}[]`

        default:
          return `@Attribute(${attributeSpecifier(type)})
  public ${name}: ${jsType(type)}`
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
    default:
      return ''
  }
}

function jsType(type?: string) {
  switch (type) {
    case 'datetime':
    case 'date':
      return 'DateTime'
    case 'decimal':
    case 'integer':
    case 'number':
      return 'number'

    case 'string':
    case 'text':
      return 'string'

    default:
      return 'any'
  }
}

// Deprecate classNameFromRawStr once dream models have been rebuilt to use fully-qualified class names.
function classNameFromRawStr(className: string) {
  const classNameParts = className.split('/')
  return classNameParts[classNameParts.length - 1]
}

function fullyQualifiedClassNameFromRawStr(className: string) {
  return className
    .split('/')
    .map(name => pascalize(name))
    .join('')
}

function hasDateTimeType(attributes: string[]) {
  return !!attributes.map(attr => jsType(attr.split(':')[1])).find(a => a === 'DateTime')
}

function pathToModelFromSerializer(fullyQualifiedSerializerName: string, fullyQualifiedModelName: string) {
  const numAdditionalUpdirs = fullyQualifiedSerializerName.split('/').length - 1
  let modelPath = `models/${fullyQualifiedModelName}`
  for (let i = 0; i <= numAdditionalUpdirs; i++) {
    modelPath = `../${modelPath}`
  }
  return modelPath
}

function importStatementForModel(fullyQualifiedSerializerName: string, fullyQualifiedModelName: string) {
  return `\nimport ${classNameFromRawStr(fullyQualifiedModelName)} from '${pathToModelFromSerializer(
    fullyQualifiedSerializerName,
    fullyQualifiedModelName
  )}'`
}
