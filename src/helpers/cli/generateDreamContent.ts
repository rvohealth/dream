import pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../../../src/helpers/camelize'
import snakeify from '../../../src/helpers/snakeify'
import uniq from '../uniq'

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

export default function generateDreamContent(
  modelName: string,
  attributes: string[],
  {
    useUUID = false,
  }: {
    useUUID?: boolean
  } = {}
) {
  const dreamImports: string[] = ['Dream', 'IdType']

  const idTypescriptType = 'IdType'

  const additionalImports: string[] = []
  const enumImports: string[] = []
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
        let belongsToOptions = descriptors.includes('many_to_one') ? ", { mode: 'many_to_one' }" : ''
        return `
@BelongsTo(() => ${dreamClassNameFromAttributeName(attributeName)}${belongsToOptions})
public ${camelize(associationName)}: ${dreamClassNameFromAttributeName(attributeName)}
public ${snakeify(associationName)}_id: ${idTypescriptType}
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
public ${attributeName}: ${getAttributeType(attribute)}\
`
    }
  })

  if (!!enumImports.length) {
    const relativePath = relativePathToRoot(modelName).replace(/^\.\//, '')
    const enumImport = `import { ${enumImports.join(', ')} } from '${relativePath}../../db/schema'`
    additionalImports.push(enumImport)
  }

  const timestamps = `
  public created_at: DateTime
  public updated_at: DateTime
`

  const tableName = snakeify(pluralize(modelName.replace(/\//g, '_')))

  return `\
import { DateTime } from 'luxon'
import { ${uniq(dreamImports).join(', ')} } from 'dream'${
    !!additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default class ${pascalize(modelName.split('/').pop()!)} extends Dream {
  public get table() {
    return '${tableName}' as const
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
    .replace(/  }$/, '}')
}

function buildImportStatement(modelName: string, attribute: string) {
  const relativePath = relativePathToRoot(modelName)

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

function relativePathToRoot(modelName: string) {
  const numNestedDirsForModel = modelName.split('/').length - 1
  let updirs = ''
  for (let i = 0; i < numNestedDirsForModel; i++) {
    updirs += '../'
  }
  const relativePath = numNestedDirsForModel > 0 ? updirs : './'
  return relativePath
}

function getAttributeType(attribute: string) {
  const [_, attributeType, ...descriptors] = attribute.split(':')

  if (attributeType === 'enum') return pascalize(descriptors[0].split('(')[0] + '_enum')
  else return (cooercedTypes as any)[attributeType] || attributeType
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split('/').pop()!)
}
