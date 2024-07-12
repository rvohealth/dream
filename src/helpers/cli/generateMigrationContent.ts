import pluralize from 'pluralize'
import snakeify from '../snakeify'
import { PrimaryKeyType } from '../../dream/types'
import InvalidDecimalFieldPassedToGenerator from '../../exceptions/invalid-decimal-field-passed-to-generator'
import foreignKeyTypeFromPrimaryKey from '../db/foreignKeyTypeFromPrimaryKey'

export default function generateMigrationContent({
  table,
  attributes = [],
  primaryKeyType = 'bigserial',
}: {
  table?: string
  attributes?: string[]
  primaryKeyType?: PrimaryKeyType
} = {}) {
  let requireCitextExtension = false
  const columnDefs = attributes
    .map(attribute => {
      const [attributeName, attributeType, ...descriptors] = attribute.split(':')
      if (['has_one', 'has_many'].includes(attributeType)) return null
      if (attributeType === 'belongs_to') return generateBelongsToStr(attributeName, { primaryKeyType })

      if (attributeType === 'citext') requireCitextExtension = true

      const coercedAttributeType = getAttributeType(attribute)
      switch (attributeType) {
        case 'enum':
          return generateEnumStr(attribute)

        case 'decimal':
          return generateDecimalStr(attribute)

        default:
          return generateColumnStr(attributeName, coercedAttributeType, descriptors)
      }
    })
    .filter(str => str !== null)

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
    ? `await db.executeQuery(CompiledQuery.raw('CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;'))\n  `
    : ''
  const kyselyImports = ['Kysely', 'sql']
  if (requireCitextExtension) kyselyImports.push('CompiledQuery')

  return `\
import { ${kyselyImports.join(', ')} } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  ${citextExtension}${generateEnumStatements(attributes)}await db.schema
    .createTable('${table}')
    ${generateIdStr({ primaryKeyType })}${columnDefs.length ? '\n    ' + columnDefs.join('\n    ') : ''}
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('${table}').execute()${generateEnumDropStatements(attributes)}
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

function generateEnumStatements(attributes: string[]) {
  const enumStatements = attributes.filter(attribute => /:enum:.*:/.test(attribute))
  const finalStatements = enumStatements.map(statement => {
    const enumName = statement.split(':')[2]
    const attributes = statement.split(':')[3].split(/,\s{0,}/)
    return `await db.schema
    .createType('${enumName}_enum')
    .asEnum([
      ${attributes.map(attr => `'${attr}'`).join(',\n      ')}
    ])
    .execute()`
  })

  return finalStatements.length ? finalStatements.join('\n\n  ') + '\n\n  ' : ''
}

function generateEnumDropStatements(attributes: string[]) {
  const enumStatements = attributes.filter(attribute => /:enum:.*:/.test(attribute))
  const finalStatements = enumStatements.map(statement => {
    const enumName = statement.split(':')[2]
    return `await db.schema.dropType('${enumName}_enum').execute()`
  })

  return finalStatements.length ? '\n  ' + finalStatements.join('\n  ') : ''
}

function generateEnumStr(attribute: string) {
  const computedAttributeType = enumAttributeType(attribute)
  return `.addColumn('${attribute.split(':')[0]}', ${computedAttributeType})`
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

  if (descriptors.includes('primary')) returnStr += `.defaultTo('${providedDefault}')`
  if (providedDefault) returnStr += `.defaultTo('${providedDefault}')`
  // TODO: handle index

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

function generateBelongsToStr(attributeName: string, { primaryKeyType }: { primaryKeyType: PrimaryKeyType }) {
  const dataType = foreignKeyTypeFromPrimaryKey(primaryKeyType)
  const references = pluralize(snakeify(attributeName).replace(/\//g, '_').replace(/_id$/, ''))
  return `.addColumn('${snakeify(attributeName)
    .replace(/\//g, '_')
    .replace(
      /_id$/,
      ''
    )}_id', '${dataType}', col => col.references('${references}.id').onDelete('restrict').notNull())`
}

function generateIdStr({ primaryKeyType }: { primaryKeyType: PrimaryKeyType }) {
  return `.addColumn('id', '${primaryKeyType}', col => col.primaryKey())`
}
