import path from 'path'
import pluralize from 'pluralize'
import camelize from '../camelize'
import pascalize from '../pascalize'
import initializeDream from '../initializeDream'
import { loadDreamYamlFile } from '../path'
import uniq from '../uniq'

export default async function generateSerializerContent(
  fullyQualifiedSerializerName: string,
  fullyQualifiedModelName?: string,
  attributes: string[] = []
) {
  const yamlConf = await loadDreamYamlFile()
  await initializeDream()

  const serializerClass = fullyQualifiedClassNameFromRawStr(fullyQualifiedSerializerName)
  const serializerIndexClass = fullyQualifiedIndexClassNameFromRawStr(fullyQualifiedSerializerName)
  const enumImports: string[] = []
  const additionalImports: string[] = []
  let relatedModelImport = ''
  let modelClass = ''
  let dataTypeCapture = ''
  let dreamSerializerTypeArgs = ''
  const dreamImports = ['DreamSerializer', 'Attribute']
  let extendedClass = 'DreamSerializer'

  if (fullyQualifiedModelName) {
    relatedModelImport = importStatementForModel(fullyQualifiedSerializerName, fullyQualifiedModelName)
    modelClass = classNameFromRawStr(fullyQualifiedModelName)
    dataTypeCapture = `<
  DataType extends ${modelClass},
  Passthrough extends object
>`
    dreamSerializerTypeArgs = `<DataType, Passthrough>`
    dreamImports.push('DreamColumn')
    extendedClass = serializerIndexClass
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
    const [name, type, ...descriptors] = attr.split(':')
    if (['belongs_to', 'has_one', 'has_many'].includes(type)) {
      additionalModelImports.push(importStatementForModel(fullyQualifiedSerializerName, name))
    }

    if (type === 'enum') {
      const enumName = descriptors[0] + '_enum'
      enumImports.push(pascalize(enumName))
    }
  })

  if (enumImports.length) {
    const schemaPath = path.join(yamlConf.db_path, 'sync.ts')
    const relativePath = path.join(
      await relativePathToSrcRoot(fullyQualifiedSerializerName),
      schemaPath.replace(/\.ts$/, '')
    )
    const enumImport = `import { ${enumImports.join(', ')} } from '${relativePath}'`
    additionalImports.push(enumImport)
  }

  const additionalImportsStr = additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''

  let indexSerializer = ''
  if (modelClass) {
    indexSerializer = `

export class ${extendedClass}${dataTypeCapture} extends DreamSerializer${dreamSerializerTypeArgs} {
  @Attribute('string')
  public id: DreamColumn<${modelClass}, 'id'>
}`
  }

  return `\
${luxonImport}import { ${dreamImports.join(
    ', '
  )} } from '@rvohealth/dream'${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}${indexSerializer}

export default class ${serializerClass}${dataTypeCapture} extends ${extendedClass}${dreamSerializerTypeArgs} {
  ${attributes
    .map(attr => {
      const [name, type] = attr.split(':')
      const propertyName = camelize(name)
      const className = classNameFromRawStr(name)

      switch (type) {
        case 'belongs_to':
        case 'has_one':
          return `@RendersOne()
  public ${camelize(className)}: ${className}`

        case 'has_many':
          return `@RendersMany()
  public ${pluralize(camelize(className))}: ${className}[]`

        default:
          return `@Attribute(${attributeSpecifier(type, attr)}${attributeOptionsSpecifier(type, attr)})
  public ${propertyName}: ${jsType(type, attr, propertyName, modelClass)}`
      }
    })
    .join('\n\n  ')}
}\
`
}

function attributeSpecifier(type: string, originalAttribute: string) {
  switch (type) {
    case 'date':
      return "'date'"
    case 'decimal':
      return "'decimal'"
    case 'jsonb':
    case 'json':
      return "'json'"
    case 'enum':
      return `'enum:${pascalize(originalAttribute.split(':')[2])}Enum'`
    case 'bigint':
    case 'uuid':
      return "'string'"
    case 'integer':
      return "'number'"
    default:
      return type ? `'${type}'` : ''
  }
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

// Deprecate classNameFromRawStr once dream models have been rebuilt to use fully-qualified class names.
function classNameFromRawStr(className: string) {
  const classNameParts = className.split('/')
  return pascalize(classNameParts[classNameParts.length - 1])
}

function fullyQualifiedClassNameFromRawStr(className: string) {
  return className
    .split('/')
    .map(name => pascalize(name))
    .join('')
}

function fullyQualifiedIndexClassNameFromRawStr(className: string) {
  return fullyQualifiedClassNameFromRawStr(className).replace(/Serializer$/, 'IndexSerializer')
}

function hasJsType(attributes: string[], expectedType: 'DateTime' | 'CalendarDate') {
  return !!attributes
    .map(attr => {
      const [name] = attr.split(':')
      return jsType(name, attr, camelize(name))
    })
    .find(a => a === expectedType)
}

function pathToModelFromSerializer(fullyQualifiedSerializerName: string, fullyQualifiedModelName: string) {
  const numAdditionalUpdirs = fullyQualifiedSerializerName.split('/').length - 1
  let modelPath = `models/${fullyQualifiedModelName
    .split('/')
    .map(str => pascalize(str))
    .join('/')}`
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

function relativePathToModelRoot(modelName: string) {
  const numNestedDirsForModel = modelName.split('/').length - 1
  let updirs = ''
  for (let i = 0; i < numNestedDirsForModel; i++) {
    updirs += '../'
  }
  return numNestedDirsForModel > 0 ? updirs : './'
}

async function relativePathToSrcRoot(modelName: string) {
  const yamlConf = await loadDreamYamlFile()
  const rootPath = relativePathToModelRoot(modelName)
  const numUpdirsInRootPath = yamlConf.models_path.split('/').length
  let updirs = ''
  for (let i = 0; i < numUpdirsInRootPath; i++) {
    updirs += '../'
  }

  return rootPath === './' ? updirs : path.join(rootPath, updirs)
}
