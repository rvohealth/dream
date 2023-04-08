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
  date: 'Date',
  datetime: 'Date',
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
  time: 'Date',
  timestamp: 'Date',
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
  const sequelizeImports: string[] = ['Sequelize', 'DataType', 'Table', 'Column', 'PrimaryKey']
  if (useUUID) sequelizeImports.push('IsUUID')
  else sequelizeImports.push('AutoIncrement')

  const howlImports: string[] = ['HowlModel']
  if (useUUID) howlImports.push('UUID')

  const uuidFlagTrimmed = useUUID ? '@IsUUID(4)\n' : ''
  const uuidFlag = useUUID ? uuidFlagTrimmed + '  ' : ''
  const idTypescriptType = useUUID ? 'UUID' : 'number'
  const idDataType = useUUID ? 'DataType.UUID' : 'DataType.INTEGER'
  const newIdOpts = useUUID ? '{ defaultValue: Sequelize.literal("uuid_generate_v4()") }' : 'DataType.INTEGER'
  const autoIncrementFlag = useUUID ? '' : '\n  @AutoIncrement'

  const additionalImports: string[] = []
  const attributeStatements = attributes.map(attribute => {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    const associationImportStatement = `import ${pascalize(attributeName)} from './${hyphenize(
      attributeName
    )}'`
    const formattedAttributeName = camelize(attributeName)

    if (!attributeType) throw `must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`

    switch (attributeType) {
      case 'belongs_to':
        sequelizeImports.push('BelongsTo')
        sequelizeImports.push('ForeignKey')
        additionalImports.push(associationImportStatement)
        let belongsToOptions = descriptors.includes('many_to_one') ? ", { mode: 'many_to_one' }" : ''
        return `\
${uuidFlagTrimmed}@ForeignKey(() => ${pascalize(attributeName)})
@Column(${idDataType})
public ${formattedAttributeName}Id: ${idTypescriptType}

@BelongsTo(() => ${pascalize(attributeName)}${belongsToOptions})
public ${formattedAttributeName}: ${pascalize(attributeName)}\
`

      case 'has_one':
        sequelizeImports.push('HasOne')
        additionalImports.push(associationImportStatement)
        return `\
@HasOne(() => ${pascalize(attributeName)}, { inverse: ${camelize(attributeName)} => ${camelize(
          attributeName
        )}.${pluralize.singular(modelName)} })
public ${formattedAttributeName}: ${pascalize(attributeName)}\
`

      case 'has_many':
        sequelizeImports.push('HasMany')
        additionalImports.push(associationImportStatement)
        return `\
@HasMany(() => ${pascalize(attributeName)}, { inverse: ${camelize(attributeName)} => ${camelize(
          attributeName
        )}.${pluralize.singular(modelName)} })
public ${pluralize(formattedAttributeName)}: ${pascalize(attributeName)}[]\
`

      default:
        return `\
${columnStatement(attributeType)}
public ${formattedAttributeName}: ${(cooercedTypes as any)[attributeType] || attributeType}\
`
    }
  })

  const timestamps = `
  @Column(DataType.DATE)
  public createdAt: Date

  @Column(DataType.DATE)
  public updatedAt: Date`

  const tableName = snakeify(pluralize(modelName))
  const uniqueSequelizeImports = [...new Set(sequelizeImports)]

  return `\
import { ${uniqueSequelizeImports.join(', ')} } from 'sequelize-typescript'
import { ${howlImports.join(', ')} } from 'howl'${
    !!additionalImports.length ? '\n' + additionalImports.join('\n') : ''
  }

@Table({ tableName: '${tableName}', underscored: true })
export default class ${pascalize(pluralize.singular(modelName))} extends HowlModel {
  ${uuidFlag}@PrimaryKey${autoIncrementFlag}
  @Column(${newIdOpts})
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
      return '@Column(DataType.DATE)'

    case 'citext':
      return '@Column(DataType.CITEXT)'

    default:
      return '@Column'
  }
}
