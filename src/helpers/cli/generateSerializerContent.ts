import pluralize from 'pluralize'
import camelize from '../camelize'

export default async function generateSerializerContent(
  serializerClassName: string,
  fullyQualifiedModelName?: string,
  attributes: string[] = []
) {
  let relatedModelImport = ''
  let modelClass = ''
  let typeArgs = ''
  if (fullyQualifiedModelName) {
    relatedModelImport = importStatementForModel(serializerClassName, fullyQualifiedModelName)
    modelClass = classNameFromRawStr(fullyQualifiedModelName)
    typeArgs = `<${modelClass}>`
  }

  if (!attributes.length)
    return `\
import { DreamSerializer } from 'dream'${relatedModelImport}

export default class ${classNameFromRawStr(serializerClassName)} extends DreamSerializer${typeArgs} {}`

  const luxonImport = hasDateTimeType(attributes) ? "import { DateTime } from 'luxon'\n" : ''

  const dreamImports = ['DreamSerializer', 'Attribute']
  if (attributes.find(attr => /:belongs_to|:has_one/.test(attr))) dreamImports.push('RendersOne')
  if (attributes.find(attr => /:has_many/.test(attr))) dreamImports.push('RendersMany')

  const additionalModelImports: string[] = []
  attributes.forEach(attr => {
    const [name, type] = attr.split(':')
    if (['belongs_to', 'has_one', 'has_many'].includes(type)) {
      additionalModelImports.push(importStatementForModel(serializerClassName, name))
    }
  })

  return `\
${luxonImport}import { ${dreamImports.join(
    ', '
  )} } from 'dream'${relatedModelImport}${additionalModelImports.join('')}

export default class ${classNameFromRawStr(serializerClassName)} extends DreamSerializer${typeArgs} {
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

function classNameFromRawStr(className: string) {
  const classNameParts = className.split('/')
  return classNameParts[classNameParts.length - 1]
}

function hasDateTimeType(attributes: string[]) {
  return !!attributes.map(attr => jsType(attr.split(':')[1])).find(a => a === 'DateTime')
}

function pathToModelFromSerializer(serializerClassName: string, fullyQualifiedModelName: string) {
  const numAdditionalUpdirs = serializerClassName.split('/').length - 1
  let modelPath = `models/${fullyQualifiedModelName}`
  for (let i = 0; i <= numAdditionalUpdirs; i++) {
    modelPath = `../${modelPath}`
  }
  return modelPath
}

function importStatementForModel(serializerClassName: string, fullyQualifiedModelName: string) {
  return `\nimport ${classNameFromRawStr(fullyQualifiedModelName)} from '${pathToModelFromSerializer(
    serializerClassName,
    fullyQualifiedModelName
  )}'`
}
