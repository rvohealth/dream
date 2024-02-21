import pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import snakeify from '../../../shared/helpers/snakeify'
import InvalidDecimalFieldPassedToGenerator from '../../exceptions/invalid-decimal-field-passed-to-generator'

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

export async function up(db: Kysely<any>): Promise<void> {
}

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

export async function up(db: Kysely<any>): Promise<void> {
  ${citextExtension}${generateEnumStatements(attributes)}await db.schema
    .createTable('${table}')
    ${generateIdStr({ useUUID })}${columnDefs.length ? '\n    ' + columnDefs.join('\n    ') : ''}
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('${table}').execute()${generateEnumDropStatements(attributes)}
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

    case 'string':
      return `varchar(${descriptors[0] || 255})`

    default:
      return attributeType
  }
}

function enumAttributeType(attribute: string) {
  const [_, __, ...descriptors] = attribute.split(':')
  return `sql\`${descriptors[0]}_enum\``
}

function generateEnumStatements(attributes: string[]) {
  const enumStatements = attributes.filter(attribute => /:enum:.*\:/.test(attribute))
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
  const enumStatements = attributes.filter(attribute => /:enum:.*\:/.test(attribute))
  const finalStatements = enumStatements.map(statement => {
    const enumName = statement.split(':')[2]
    const attributes = statement.split(':')[3].split(/,\s{0,}/)
    return `await db.schema.dropType('${enumName}_enum').execute()`
  })

  return finalStatements.length ? '\n  ' + finalStatements.join('\n  ') : ''
}

function generateEnumStr(attribute: string) {
  const computedAttributeType = enumAttributeType(attribute)
  return `.addColumn('${attribute.split(':')[0]}', ${computedAttributeType})`
}

function generateDecimalStr(attribute: string) {
  const [attributeName, attributeType, ...descriptors] = attribute.split(':')
  const [scale, precision] = descriptors[0]?.split(',') || [null, null]
  if (!scale || !precision) throw new InvalidDecimalFieldPassedToGenerator(attribute)

  return `.addColumn('${attribute.split(':')[0]}', 'decimal(${scale}, ${precision})')`
}

function generateColumnStr(attributeName: string, attributeType: string, descriptors: string[]) {
  const attributeStatement = ['citext'].includes(attributeType)
    ? `sql\`${attributeType}\``
    : `'${attributeType}'`
  let returnStr = `.addColumn('${attributeName}', ${attributeStatement}`

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
  const references = pluralize(snakeify(attributeName).replace(/_id$/, ''))
  return `.addColumn('${snakeify(attributeName).replace(
    /_id$/,
    ''
  )}_id', '${dataType}', col => col.references('${references}.id').onDelete('restrict').notNull())`
}

function generateIdStr({ useUUID }: { useUUID: boolean }) {
  if (useUUID) return `.addColumn('id', 'uuid', col => col.primaryKey())`
  return `.addColumn('id', 'bigserial', col => col.primaryKey())`
}
