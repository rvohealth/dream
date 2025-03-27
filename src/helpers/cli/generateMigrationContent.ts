import pluralize from 'pluralize-esm'
import InvalidDecimalFieldPassedToGenerator from '../../errors/InvalidDecimalFieldPassedToGenerator.js'
import { PrimaryKeyType } from '../../types/dream.js'
import foreignKeyTypeFromPrimaryKey from '../db/foreignKeyTypeFromPrimaryKey.js'
import snakeify from '../snakeify.js'

const COLUMNS_TO_INDEX = ['type']
const NOT_NULL_COLUMNS = ['type']

interface ColumnDefsAndDrops {
  columnDefs: string[]
  columnDrops: string[]
  indexDefs: string[]
  indexDrops: string[]
}

export default function generateMigrationContent({
  table,
  columnsWithTypes = [],
  primaryKeyType = 'bigserial',
  createOrAlter = 'create',
}: {
  table?: string
  columnsWithTypes?: string[]
  primaryKeyType?: PrimaryKeyType
  createOrAlter?: 'create' | 'alter'
} = {}) {
  const altering = createOrAlter === 'alter'
  let requireCitextExtension = false

  const { columnDefs, columnDrops, indexDefs, indexDrops } = columnsWithTypes.reduce(
    (acc: ColumnDefsAndDrops, attribute: string) => {
      const { columnDefs, columnDrops, indexDefs, indexDrops } = acc
      const [nonStandardAttributeName, attributeType, ...descriptors] = attribute.split(':')
      let attributeName = snakeify(nonStandardAttributeName)

      if (['has_one', 'has_many'].includes(attributeType)) return acc

      if (attributeType === 'citext') requireCitextExtension = true

      const coercedAttributeType = getAttributeType(attribute)
      switch (attributeType) {
        case 'belongs_to':
          columnDefs.push(
            generateBelongsToStr(attributeName, {
              primaryKeyType,
              optional: descriptors.includes('optional'),
            })
          )
          attributeName = associationNameToForeignKey(attributeName)
          break

        case 'enum':
          columnDefs.push(generateEnumStr(attribute))
          break

        case 'decimal':
          columnDefs.push(generateDecimalStr(attribute))
          break

        case 'boolean':
          columnDefs.push(generateBooleanStr(attributeName))
          break

        case 'encrypted':
          columnDefs.push(generateColumnStr(`encrypted_${attributeName}`, 'text', descriptors))
          break

        default:
          columnDefs.push(generateColumnStr(attributeName, coercedAttributeType, descriptors))
          break
      }

      columnDrops.push(`.dropColumn('${attributeName}')`)

      if (COLUMNS_TO_INDEX.includes(attributeName)) {
        const indexName = `${table}_${attributeName}`

        indexDefs.push(`await db.schema
    .createIndex('${indexName}')
    .on('${table}')
    .column('${attributeName}')
    .execute()`)

        indexDrops.push(`await db.schema.dropIndex('${indexName}').execute()`)
      }

      return acc
    },
    { columnDefs: [], columnDrops: [], indexDefs: [], indexDrops: [] } as ColumnDefsAndDrops
  )

  if (!table) {
    return `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
}\
`
  }

  const citextExtension = requireCitextExtension
    ? `  await DreamMigrationHelpers.createExtension(db, 'citext')\n\n`
    : ''
  const kyselyImports = ['Kysely', 'sql']
  const dreamImports: string[] = []
  if (requireCitextExtension) dreamImports.push('DreamMigrationHelpers')

  const newlineIndent = '\n  '
  const newlineDoubleIndent = '\n    '
  const columnDefLines = columnDefs.length ? newlineDoubleIndent + columnDefs.join(newlineDoubleIndent) : ''
  const columnDropLines = columnDrops.length
    ? newlineDoubleIndent + columnDrops.join(newlineDoubleIndent) + newlineDoubleIndent
    : ''

  return `\
${dreamImports.length ? `import { ${dreamImports.join(', ')} } from '@rvoh/dream'\n` : ''}import { ${kyselyImports.join(', ')} } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
${citextExtension}${generateEnumStatements(columnsWithTypes)}  await db.schema
    .${altering ? 'alterTable' : 'createTable'}('${table}')${
      altering ? '' : newlineDoubleIndent + generateIdStr({ primaryKeyType })
    }${columnDefLines}${
      altering
        ? ''
        : newlineDoubleIndent +
          ".addColumn('created_at', 'timestamp', col => col.notNull())" +
          newlineDoubleIndent +
          ".addColumn('updated_at', 'timestamp', col => col.notNull())"
    }
    .execute()${indexDefs.length ? `\n${newlineIndent}` : ''}${indexDefs.join(newlineDoubleIndent)}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  ${indexDrops.join(newlineIndent)}${indexDrops.length ? newlineIndent : ''}${
    altering
      ? `await db.schema${newlineDoubleIndent}.alterTable('${table}')${columnDropLines}.execute()`
      : `await db.schema.dropTable('${table}').execute()`
  }${generateEnumDropStatements(columnsWithTypes)}
}\
`
}

function getAttributeType(attribute: string) {
  const [, attributeType, ...descriptors] = attribute.split(':')
  if (attributeType === 'enum') {
    return enumAttributeType(attribute)[0]
  }

  switch (attributeType) {
    case 'datetime':
      return 'timestamp'

    case 'string':
      return `varchar(${descriptors[0] || 255})`

    default:
      return attributeType
  }
}

function enumAttributeType(attribute: string) {
  const [, , ...descriptors] = attribute.split(':')
  return `sql\`${descriptors[0]}_enum\``
}

function generateEnumStatements(columnsWithTypes: string[]) {
  const enumStatements = columnsWithTypes.filter(attribute => /:enum:.*:/.test(attribute))
  const finalStatements = enumStatements.map(statement => {
    const enumName = statement.split(':')[2]
    const columnsWithTypes = statement.split(':')[3].split(/,\s{0,}/)
    return `  await db.schema
    .createType('${enumName}_enum')
    .asEnum([
      ${columnsWithTypes.map(attr => `'${attr}'`).join(',\n      ')}
    ])
    .execute()`
  })

  return finalStatements.length ? finalStatements.join('\n\n') + '\n\n' : ''
}

function generateEnumDropStatements(columnsWithTypes: string[]) {
  const enumStatements = columnsWithTypes.filter(attribute => /:enum:.*:/.test(attribute))
  const finalStatements = enumStatements.map(statement => {
    const enumName = statement.split(':')[2]
    return `await db.schema.dropType('${enumName}_enum').execute()`
  })

  return finalStatements.length ? '\n\n  ' + finalStatements.join('\n  ') : ''
}

function generateBooleanStr(attributeName: string) {
  return `.addColumn('${attributeName}', 'boolean', col => col.notNull().defaultTo(false))`
}

function generateEnumStr(attribute: string) {
  const computedAttributeType = enumAttributeType(attribute)
  const attributeName = attribute.split(':')[0]
  const notNull = NOT_NULL_COLUMNS.includes(attributeName)
  return `.addColumn('${attributeName}', ${computedAttributeType}${notNull ? ', col => col.notNull()' : ''})`
}

function generateDecimalStr(attribute: string) {
  const [, , ...descriptors] = attribute.split(':')
  const [scale, precision] = descriptors[0]?.split(',') || [null, null]
  if (!scale || !precision) throw new InvalidDecimalFieldPassedToGenerator(attribute)

  return `.addColumn('${attribute.split(':')[0]}', 'decimal(${scale}, ${precision})')`
}

function generateColumnStr(attributeName: string, attributeType: string, descriptors: string[]) {
  let returnStr = `.addColumn('${attributeName}', ${attributeTypeString(attributeType)}`

  const providedDefaultArg = descriptors.find(d => /^default\(/.test(d))
  const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '')
  const hasExtraValues = descriptors.includes('primary') || providedDefault
  if (hasExtraValues) returnStr += ', col => col'

  if (descriptors.includes('primary') || providedDefault) returnStr += `.defaultTo('${providedDefault}')`

  return `${returnStr}${hasExtraValues ? '))' : ')'}`
}

function attributeTypeString(attributeType: string) {
  const attributeTypesRequiringSql = ['citext']
  if (attributeTypesRequiringSql.includes(attributeType)) return `sql\`${attributeType}\``

  switch (attributeType) {
    case 'varbit':
    case 'bitvarying':
      return "'bit varying'"
    case 'txid_snapshot':
      return "'txid_snapshot'"
    default:
      return `'${attributeType.replace(/_/g, ' ')}'`
  }
}

function generateBelongsToStr(
  associationName: string,
  {
    primaryKeyType,
    optional = false,
  }: {
    primaryKeyType: PrimaryKeyType
    optional?: boolean
  }
) {
  const dataType = foreignKeyTypeFromPrimaryKey(primaryKeyType)
  const references = pluralize(associationName.replace(/\//g, '_').replace(/_id$/, ''))
  return `.addColumn('${associationNameToForeignKey(associationName)}', '${dataType}', col => col.references('${references}.id').onDelete('restrict')${optional ? '' : '.notNull()'})`
}

function generateIdStr({ primaryKeyType }: { primaryKeyType: PrimaryKeyType }) {
  switch (primaryKeyType) {
    case 'uuid':
      return `\
.addColumn('id', 'uuid', col =>
      col
        .notNull()
        .defaultTo(sql\`uuid_generate_v4()\`)
        .unique(),
    )`

    default:
      return `.addColumn('id', '${primaryKeyType}', col => col.primaryKey())`
  }
}

function associationNameToForeignKey(associationName: string) {
  return snakeify(associationName.replace(/\//g, '_').replace(/_id$/, '') + '_id')
}
