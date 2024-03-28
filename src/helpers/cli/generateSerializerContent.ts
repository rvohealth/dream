import path from 'path'
import pluralize from 'pluralize'
import camelize from '../../../shared/helpers/camelize'
import pascalize from '../pascalize'
import initializeDream from '../../../shared/helpers/initializeDream'
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
  const enumImports: string[] = []
  const additionalImports: string[] = []
  let relatedModelImport = ''
  let modelClass = ''
  let dataTypeCapture = ''
  let dreamSerializerTypeArgs = ''
  if (fullyQualifiedModelName) {
    relatedModelImport = importStatementForModel(fullyQualifiedSerializerName, fullyQualifiedModelName)
    modelClass = classNameFromRawStr(fullyQualifiedModelName)
    dataTypeCapture = `<DataType extends ${modelClass}>`
    dreamSerializerTypeArgs = `<DataType>`
  }

  const luxonImport = hasDateTimeType(attributes) ? "import { DateTime } from 'luxon'\n" : ''

  const dreamImports = ['DreamSerializer', 'Attribute']
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

  if (!!enumImports.length) {
    const schemaPath = path.join(yamlConf.db_path, 'schema.ts')
    const relativePath = path.join(
      await relativePathToSrcRoot(fullyQualifiedSerializerName),
      schemaPath.replace(/\.ts$/, '')
    )
    const enumImport = `import { ${enumImports.join(', ')} } from '${relativePath}'`
    additionalImports.push(enumImport)
  }

  const additionalImportsStr = !!additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''

  return `\
${luxonImport}import { ${dreamImports.join(
    ', '
  )} } from '@rvohealth/dream'${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}

export default class ${serializerClass}${dataTypeCapture} extends DreamSerializer${dreamSerializerTypeArgs} {
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
          return `@Attribute(${attributeSpecifier(type, attr)}${attributeOptionsSpecifier(type, attr)})
  public ${camelize(name)}: ${jsType(type, attr)}`
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
      const coercedType = pascalize(originalAttribute.split(':')[2])
      return `'enum:${coercedType}Enum'`
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

function jsType(type: string, originalAttribute: string) {
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

function hasDateTimeType(attributes: string[]) {
  return !!attributes.map(attr => jsType(attr.split(':')[1], attr)).find(a => a === 'DateTime')
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
