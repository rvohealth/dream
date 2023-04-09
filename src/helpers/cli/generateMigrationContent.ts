import * as pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'

const typeCoersions = {
  citext: 'citext',
  date: 'date',
  datetime: 'datetime',
  string: 'text',
  timestamp: 'timestamp',
}

export default function generateMigrationString(
  migrationName: string,
  timestamp: number,
  {
    table,
    attributes = [],
    useUUID = false,
  }: {
    table?: string
    attributes?: string[]
    useUUID?: boolean
  } = {}
) {
  let requireCitextExtension = false
  const columnDefs = attributes
    .map(attribute => {
      const [attributeName, attributeType, ...descriptors] = attribute.split(':')
      let coercedAttributeType = (typeCoersions as any)[attributeType] || attributeType
      if (['has_one', 'has_many'].includes(attributeType)) return null
      if (attributeType === 'belongs_to') return generateBelongsToStr(attributeName, { useUUID })
      else if (attributeType === 'citext') requireCitextExtension = true

      return generateColumnStr(attributeName, coercedAttributeType, descriptors)
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
  await db.schema
    .createTable('${table}')
    ${generateIdStr({ useUUID })}${columnDefs.length ? '\n    ' + columnDefs.join('\n    ') : ''}
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql\`now()\`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql\`now()\`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}\
`
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
  const dataType = `${useUUID ? 'uuid' : 'serial'}`
  const references = pluralize(attributeName.replace(/_id$/, ''))
  return `.addColumn('${attributeName}', '${dataType}', col => col.references('${references}.id').onDelete('cascade').notNull())`
}

function generateIdStr({ useUUID }: { useUUID: boolean }) {
  if (useUUID) return `.addColumn('id', 'uuid', col => col.primaryKey())`
  return `.addColumn('id', 'serial', col => col.primaryKey())`
}
