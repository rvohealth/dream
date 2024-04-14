import path from 'path'
import pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../camelize'
import snakeify from '../snakeify'
import uniq from '../uniq'
import { loadDreamYamlFile } from '../path'
import initializeDream from '../initializeDream'

const cooercedTypes = {
  bigint: 'string',
  bigserial: 'IdType',
  bit: 'string',
  boolean: 'boolean',
  box: 'string',
  bytea: 'string',
  character: 'string',
  cidr: 'string',
  circle: 'string',
  citext: 'string',
  decimal: 'number',
  date: 'DateTime',
  datetime: 'DateTime',
  double: 'string',
  float: 'number', // custom
  inet: 'string',
  integer: 'number',
  interval: 'string',
  json: 'string',
  jsonb: 'string',
  line: 'string',
  lseg: 'string',
  macaddr: 'string',
  macaddr8: 'string',
  money: 'string',
  numeric: 'number',
  path: 'string',
  pg_lsn: 'string',
  pg_snapshot: 'string',
  point: 'string',
  polygon: 'string',
  real: 'string',
  smallint: 'string',
  smallserial: 'string',
  serial: 'string',
  text: 'string',
  time: 'DateTime',
  timestamp: 'DateTime',
  tsquery: 'string',
  tsvector: 'string',
  txid_snapshot: 'string',
  uuid: 'string',
  xml: 'string',
}

export default async function generateDreamContent(modelName: string, attributes: string[]) {
  await initializeDream()

  const dreamImports: string[] = ['Dream', 'IdType']

  const idTypescriptType = 'IdType'

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
public ${camelize(associationName)}Id: ${idTypescriptType}
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
public ${camelize(attributeName)}: ${getAttributeType(attribute)}\
`
    }
  })

  const yamlConf = await loadDreamYamlFile()
  if (enumImports.length) {
    const schemaPath = path.join(yamlConf.db_path, 'schema.ts')
    const relativePath = path.join(await relativePathToSrcRoot(modelName), schemaPath.replace(/\.ts$/, ''))
    const enumImport = `import { ${enumImports.join(', ')} } from '${relativePath}'`
    additionalImports.push(enumImport)
  }

  const timestamps = `
  public createdAt: DateTime
  public updatedAt: DateTime
`

  const tableName = snakeify(pluralize(modelName.replace(/\//g, '_')))

  const relativePath = relativePathToModelRoot(modelName)

  return `\
import { DateTime } from 'luxon'
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ApplicationModel from '${relativePath}ApplicationModel'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default class ${pascalize(modelName.split('/').pop()!)} extends ApplicationModel {
  public get table() {
    return '${tableName}' as const
  }

  public get serializer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ${serializerNameFromModelName(modelName)}<any, any>
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
  const importStatement = `import ${serializerClassName} from '${serializerPath}'`
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

function getAttributeType(attribute: string) {
  const [, attributeType, ...descriptors] = attribute.split(':')

  if (attributeType === 'enum') return pascalize(descriptors[0].split('(')[0] + '_enum')
  else return (cooercedTypes as any)[attributeType] || attributeType
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split('/').pop()!)
}
