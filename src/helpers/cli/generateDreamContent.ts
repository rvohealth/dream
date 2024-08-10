import path from 'path'
import pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../camelize'
import initializeDream from '../initializeDream'
import pascalizePath from '../pascalizePath'
import relativeDreamPath from '../path/relativeDreamPath'
import snakeify from '../snakeify'
import uniq from '../uniq'

export default async function generateDreamContent(modelName: string, attributes: string[]) {
  await initializeDream()
  const modelClassName = pascalizePath(modelName)

  const dreamImports: string[] = ['DreamColumn', 'DreamSerializerConf']

  const idTypescriptType = `DreamColumn<${modelClassName}, 'id'>`

  const additionalImports: string[] = []

  const serializerImport = await buildSerializerImportStatement(modelName)
  additionalImports.push(serializerImport)

  const attributeStatements = attributes.map(attribute => {
    const [attributeName, attributeType] = attribute.split(':')
    const associationImportStatement = buildImportStatement(modelName, attribute)
    const attributeNameParts = attributeName.split('/')
    const associationName = attributeNameParts[attributeNameParts.length - 1]

    if (!attributeType) throw `must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`

    switch (attributeType) {
      case 'belongs_to':
        dreamImports.push('BelongsTo')
        additionalImports.push(associationImportStatement)
        return `
@BelongsTo(() => ${pascalizePath(attributeName)})
public ${camelize(associationName)}: ${pascalizePath(attributeName)}
public ${camelize(associationName)}Id: DreamColumn<${modelClassName}, '${camelize(associationName)}Id'>
`

      case 'has_one':
        dreamImports.push('HasOne')
        additionalImports.push(associationImportStatement)
        return `
@HasOne(() => ${pascalizePath(attributeName)})
public ${camelize(associationName)}: ${pascalizePath(attributeName)}
`

      case 'has_many':
        dreamImports.push('HasMany')
        additionalImports.push(associationImportStatement)
        return `
@HasMany(() => ${pascalizePath(attributeName)})
public ${pluralize(camelize(associationName))}: ${pascalizePath(attributeName)}[]
`

      default:
        return `
public ${camelize(attributeName)}: ${getAttributeType(attribute, modelClassName)}\
`
    }
  })

  const formattedFields = attributeStatements
    .filter(attr => !/^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('')
  const formattedDecorators = attributeStatements
    .filter(attr => /^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('\n  ')
    .replace(/\n {2}$/, '')

  let timestamps = `
  public createdAt: DreamColumn<${modelClassName}, 'createdAt'>
  public updatedAt: DreamColumn<${modelClassName}, 'updatedAt'>
`
  if (!formattedDecorators.length) timestamps = timestamps.replace(/\n$/, '')

  const tableName = snakeify(pluralize(modelName.replace(/\//g, '_')))

  const relativePath = relativePathToModelRoot(modelName)

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ApplicationModel from '${relativePath}ApplicationModel'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default class ${modelClassName} extends ApplicationModel {
  public get table() {
    return '${tableName}' as const
  }

  public id: ${idTypescriptType}${formattedFields}${timestamps}${formattedDecorators}
}

DreamSerializerConf.add(${modelClassName}, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ${serializerNameFromModelName(modelName)}<any, any>,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary: ${serializerSummaryNameFromModelName(modelName)}<any, any>,
})`.replace(/^\s*$/gm, '')
}

function buildImportStatement(modelName: string, attribute: string) {
  const relativePath = relativePathToModelRoot(modelName)

  const [attributeName] = attribute.split(':')
  const rootAssociationImport = pascalizePath(attributeName)
  const associationImportStatement = `import ${pascalize(
    rootAssociationImport
  )} from '${relativePath}${attributeName
    .split('/')
    .map(name => pascalize(name))
    .join('/')}'`
  return associationImportStatement
}

async function buildSerializerImportStatement(modelName: string) {
  const relativePath = await relativePathToSrcRoot(modelName)

  const serializerPath = path.join(
    relativePath,
    await relativeDreamPath('serializers'),
    relativeSerializerPathFromModelName(modelName)
  )
  const serializerClassName = serializerNameFromModelName(modelName)
  const serializerSummaryClassName = serializerSummaryNameFromModelName(modelName)
  const importStatement = `import ${serializerClassName}, { ${serializerSummaryClassName} } from '${serializerPath}'`
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

function serializerSummaryNameFromModelName(modelName: string) {
  return serializerNameFromModelName(modelName).replace(/Serializer$/, 'SummarySerializer')
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
  const rootPath = relativePathToModelRoot(modelName)
  const numUpdirsInRootPath = (await relativeDreamPath('models')).split('/').length
  let updirs = ''
  for (let i = 0; i < numUpdirsInRootPath; i++) {
    updirs += '../'
  }

  return rootPath === './' ? updirs : path.join(rootPath, updirs)
}

function getAttributeType(attribute: string, modelClassName: string) {
  return `DreamColumn<${modelClassName}, '${camelize(attribute.split(':')[0])}'>`
}
