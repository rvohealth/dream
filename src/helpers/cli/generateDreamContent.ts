import path from 'path'
import pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../camelize'
import snakeify from '../snakeify'
import uniq from '../uniq'
import { loadDreamYamlFile } from '../path'
import initializeDream from '../initializeDream'

export default async function generateDreamContent(modelName: string, attributes: string[]) {
  await initializeDream()
  const modelClassName = pascalize(modelName.split('/').pop()!)

  const dreamImports: string[] = ['DreamColumn']

  const idTypescriptType = `DreamColumn<${modelClassName}, 'id'>`

  const additionalImports: string[] = []
  const enumImports: string[] = []

  const serializerImport = await buildSerializerImportStatement(modelName)
  additionalImports.push(serializerImport)

  const attributeStatements = attributes.map(attribute => {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    const associationImportStatement = buildImportStatement(modelName, attribute)
    const attributeNameParts = attributeName.split('/')
    const associationName = attributeNameParts[attributeNameParts.length - 1]

    if (!attributeType) throw `must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`

    if (attributeType === 'enum') {
      const enumName = descriptors[0] + '_enum'
      enumImports.push(pascalize(enumName))
    }

    switch (attributeType) {
      case 'belongs_to':
        dreamImports.push('BelongsTo')
        additionalImports.push(associationImportStatement)
        return `
@BelongsTo(() => ${dreamClassNameFromAttributeName(attributeName)})
public ${camelize(associationName)}: ${dreamClassNameFromAttributeName(attributeName)}
public ${camelize(associationName)}Id: DreamColumn<${modelClassName}, '${camelize(associationName)}Id'>
`

      case 'has_one':
        dreamImports.push('HasOne')
        additionalImports.push(associationImportStatement)
        return `
@HasOne(() => ${dreamClassNameFromAttributeName(attributeName)})
public ${camelize(associationName)}: ${dreamClassNameFromAttributeName(attributeName)}
`

      case 'has_many':
        dreamImports.push('HasMany')
        additionalImports.push(associationImportStatement)
        return `
@HasMany(() => ${dreamClassNameFromAttributeName(attributeName)})
public ${pluralize(camelize(associationName))}: ${dreamClassNameFromAttributeName(attributeName)}[]
`

      default:
        return `
public ${camelize(attributeName)}: ${getAttributeType(attribute, modelClassName)}\
`
    }
  })

  const yamlConf = await loadDreamYamlFile()
  if (enumImports.length) {
    const schemaPath = path.join(yamlConf.db_path, 'sync.ts')
    const relativePath = path.join(await relativePathToSrcRoot(modelName), schemaPath.replace(/\.ts$/, ''))
    const enumImport = `import { ${enumImports.join(', ')} } from '${relativePath}'`
    additionalImports.push(enumImport)
  }

  const timestamps = `
  public createdAt: DreamColumn<${modelClassName}, 'createdAt'>
  public updatedAt: DreamColumn<${modelClassName}, 'updatedAt'>
`

  const tableName = snakeify(pluralize(modelName.replace(/\//g, '_')))

  const relativePath = relativePathToModelRoot(modelName)

  return `\
import { DateTime } from 'luxon'
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ApplicationModel from '${relativePath}ApplicationModel'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default class ${modelClassName} extends ApplicationModel {
  public get table() {
    return '${tableName}' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: ${serializerNameFromModelName(modelName)}<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      index: ${serializerIndexNameFromModelName(modelName)}<any, any>,
    }
  }

  public id: ${idTypescriptType}${attributeStatements
    .filter(attr => !/^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('')}${timestamps}${attributeStatements
    .filter(attr => /^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('\n  ')}\
}`
    .replace(/^\s*$/gm, '')
    .replace(/ {2}}$/, '}')
}

function buildImportStatement(modelName: string, attribute: string) {
  const relativePath = relativePathToModelRoot(modelName)

  const [attributeName] = attribute.split(':')
  const rootAssociationImport = attributeName.split('/').pop()!
  const associationImportStatement = `import ${pascalize(
    rootAssociationImport
  )} from '${relativePath}${attributeName
    .split('/')
    .map(name => pascalize(name))
    .join('/')}'`
  return associationImportStatement
}

async function buildSerializerImportStatement(modelName: string) {
  const yamlConf = await loadDreamYamlFile()
  const relativePath = await relativePathToSrcRoot(modelName)

  const serializerPath = path.join(
    relativePath,
    yamlConf.serializers_path,
    relativeSerializerPathFromModelName(modelName)
  )
  const serializerClassName = serializerNameFromModelName(modelName)
  const serializerIndexClassName = serializerIndexNameFromModelName(modelName)
  const importStatement = `import ${serializerClassName}, { ${serializerIndexClassName} } from '${serializerPath}'`
  return importStatement
}

function serializerNameFromModelName(modelName: string) {
  return (
    modelName
      .split('/')
      .map(part => pascalize(part))
      .join('') + 'Serializer'
  )
}

function serializerIndexNameFromModelName(modelName: string) {
  return serializerNameFromModelName(modelName).replace(/Serializer$/, 'IndexSerializer')
}

function relativeSerializerPathFromModelName(modelName: string) {
  return (
    modelName
      .split('/')
      .map(part => pascalize(part))
      .join('/') + 'Serializer'
  )
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

function getAttributeType(attribute: string, modelClassName: string) {
  return `DreamColumn<${modelClassName}, '${camelize(attribute.split(':')[0])}'>`
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split('/').pop()!)
}
