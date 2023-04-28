import * as pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../../../src/helpers/camelize'
import snakeify from '../../../src/helpers/snakeify'
import hyphenize from '../../../src/helpers/hyphenize'

const cooercedTypes = {
  bigint: 'number',
  bigserial: 'number',
  bit: 'string',
  boolean: 'boolean',
  box: 'string',
  bytea: 'string',
  character: 'string',
  cidr: 'string',
  circle: 'string',
  citext: 'string',
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
  const dreamImports: string[] = ['Dream', 'Column']

  const idDBType = useUUID ? 'uuid' : 'integer'
  const idTypescriptType = useUUID ? 'string' : 'number'

  const additionalImports: string[] = []
  const attributeStatements = attributes.map(attribute => {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    const associationImportStatement = `import ${pascalize(attributeName)} from './${hyphenize(
      attributeName
    )}'`

    if (!attributeType) throw `must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`

    switch (attributeType) {
      case 'belongs_to':
        dreamImports.push('BelongsTo')
        additionalImports.push(associationImportStatement)
        let belongsToOptions = descriptors.includes('many_to_one') ? ", { mode: 'many_to_one' }" : ''
        return `\
@Column('${idDBType}')
public ${attributeName}_id: ${idTypescriptType}

@BelongsTo(() => ${pascalize(attributeName)}${belongsToOptions})
public ${camelize(attributeName)}: ${pascalize(attributeName)}\
`

      case 'has_one':
        dreamImports.push('HasOne')
        additionalImports.push(associationImportStatement)
        return `\
@HasOne(() => ${pascalize(attributeName)})
public ${attributeName}: ${pascalize(attributeName)}\
`

      case 'has_many':
        dreamImports.push('HasMany')
        additionalImports.push(associationImportStatement)
        return `\
@HasMany(() => ${pascalize(attributeName)})
public ${pluralize(attributeName)}: ${pascalize(attributeName)}[]\
`

      default:
        return `\
${columnStatement(attributeType)}
public ${attributeName}: ${(cooercedTypes as any)[attributeType] || attributeType}\
`
    }
  })

  const timestamps = `
  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime`

  const tableName = snakeify(pluralize(modelName))
  const uniqueSequelizeImports = [...new Set(dreamImports)]

  return `\
import { DateTime } from 'luxon'
import { ${[...new Set(dreamImports)].join(', ')} } from 'dream'${
    !!additionalImports.length ? '\n' + additionalImports.join('\n') : ''
  }

export default class ${pascalize(pluralize.singular(modelName))} extends Dream {
  public get table() {
    return '${tableName}' as const
  }

  @Column('${idDBType}')
  public id: ${idTypescriptType}

  ${attributeStatements.map(s => s.split('\n').join('\n  ')).join('\n\n  ')}
${timestamps}
}\
`.replace(/^\s*$/gm, '')
}

function columnStatement(attributeType: string) {
  switch (attributeType) {
    case 'datetime':
    case 'date':
    case 'timestamp':
      return "@Column('datetime')"

    case 'citext':
      return "@Column('citext')"

    default:
      return `@Column('${attributeType}')`
  }
}
