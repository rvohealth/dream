import * as pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'

export default function generateMigrationContent({
  table,
  attributes = [],
  useUUID = false,
}: {
  table?: string
  attributes?: string[]
  useUUID?: boolean
} = {}) {
  let requireCitextExtension = false
  const columnDefs = attributes
    .map(attribute => {
      const [attributeName, attributeType, ...descriptors] = attribute.split(':')
      if (['has_one', 'has_many'].includes(attributeType)) return null
      if (attributeType === 'belongs_to') return generateBelongsToStr(attributeName, { useUUID })

      if (attributeType === 'citext') requireCitextExtension = true

      let coercedAttributeType = getAttributeType(attribute)
      if (attributeType === 'enum') {
        return generateEnumStr(attribute)
      } else {
        return generateColumnStr(attributeName, coercedAttributeType, descriptors)
      }
    })
    .filter(str => str !== null)

  if (!table) {
    return `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}\
`
  }

  const citextExtension = requireCitextExtension
    ? `await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "citext";')\n    `
    : ''

  return `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  ${generateEnumStatements(attributes)}await db.schema
    .createTable('${table}')
    ${generateIdStr({ useUUID })}${columnDefs.length ? '\n    ' + columnDefs.join('\n    ') : ''}
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('${table}').execute()
}\
`
}

function getAttributeType(attribute: string) {
  const [attributeName, attributeType, ...descriptors] = attribute.split(':')
  if (attributeType === 'enum') {
    return enumAttributeType(attribute)[0] as string
  }

  switch (attributeType) {
    case 'datetime':
      return 'timestamp'

    case 'datetime':
      return 'timestamp'

    case 'string':
      return 'text'

    default:
      return attributeType
  }
}

function enumAttributeType(attribute: string) {
  const [attributeName, attributeType, ...descriptors] = attribute.split(':')
  const enumName = descriptors[0]
  // if (/\(/.test(enumName)) {
  //   return descriptors[0].split('(')[0]
  // } else {
  return `sql\`${descriptors[0].split('(')[0]}\``
  // }
}

function generateEnumStatements(attributes: string[]) {
  const enumStatements = attributes.filter(attribute => /enum:.*\(/.test(attribute))
  const finalStatements = enumStatements.map(statement => {
    const enumName = statement.split(':')[2].split('(')[0]
    const attributes = statement
      .split('(')[1]
      .replace(')', '')
      .split(/,\s{0,}/)
    return `await db.schema
    .createType('${enumName}')
    .asEnum([
      ${attributes.map(attr => `'${attr}'`).join(',\n      ')}
    ])
    .execute()`
  })

  return finalStatements.length ? finalStatements.join('\n\n  ') + '\n\n  ' : ''
}

function generateEnumStr(attribute: string) {
  const computedAttributeType = enumAttributeType(attribute)
  return `.addColumn('${attribute.split(':')[0]}', ${computedAttributeType})`
}

function generateColumnStr(attributeName: string, attributeType: string, descriptors: string[]) {
  let returnStr = `.addColumn('${attributeName}', '${attributeType}'`

  const providedDefaultArg = descriptors.find(d => /^default\(/.test(d))
  const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '')
  const hasExtraValues = descriptors.includes('primary') || providedDefault
  if (hasExtraValues) returnStr += ', col => col'

  if (descriptors.includes('primary')) returnStr += `.defaultTo('${providedDefault}')`
  if (providedDefault) returnStr += `.defaultTo('${providedDefault}')`
  // TODO: handle index

  return `${returnStr}${hasExtraValues ? '))' : ')'}`
}

function generateBelongsToStr(attributeName: string, { useUUID }: { useUUID: boolean }) {
  const dataType = `${useUUID ? 'uuid' : 'bigint'}`
  const references = pluralize(attributeName.replace(/_id$/, ''))
  return `.addColumn('${attributeName.replace(
    /_id$/,
    ''
  )}_id', '${dataType}', col => col.references('${references}.id').onDelete('cascade').notNull())`
}

function generateIdStr({ useUUID }: { useUUID: boolean }) {
  if (useUUID) return `.addColumn('id', 'uuid', col => col.primaryKey())`
  return `.addColumn('id', 'serial', col => col.primaryKey())`
}
