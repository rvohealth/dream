import pluralize from 'pluralize-esm'
import Dream from '../../Dream.js'
import Query from '../../dream/Query.js'
import InvalidDecimalFieldPassedToGenerator from '../../errors/InvalidDecimalFieldPassedToGenerator.js'
import { PrimaryKeyType } from '../../types/dream.js'
import compact from '../compact.js'
import snakeify from '../snakeify.js'

const STI_TYPE_COLUMN_NAME = 'type'
const COLUMNS_TO_INDEX = [STI_TYPE_COLUMN_NAME]

interface ColumnDefsAndDrops {
  columnDefs: string[]
  columnDrops: string[]
  indexDefs: string[]
  indexDrops: string[]
}

export default function generateMigrationContent({
  connectionName = 'default',
  table,
  columnsWithTypes = [],
  primaryKeyType = 'bigserial',
  createOrAlter = 'create',
  stiChildClassName,
}: {
  connectionName?: string
  table?: string | undefined
  columnsWithTypes?: string[] | undefined
  primaryKeyType?: PrimaryKeyType | undefined
  createOrAlter?: 'create' | 'alter' | undefined
  stiChildClassName?: string | undefined
} = {}) {
  const altering = createOrAlter === 'alter'
  let requireCitextExtension = false
  const checkConstraints: string[] = []

  const { columnDefs, columnDrops, indexDefs, indexDrops } = columnsWithTypes.reduce(
    (acc: ColumnDefsAndDrops, attributeDeclaration: string) => {
      const { columnDefs, columnDrops, indexDefs, indexDrops } = acc
      const [nonStandardAttributeName, attributeType, ...descriptors] = attributeDeclaration.split(':')
      const userWantsThisOptional = optionalFromDescriptors(descriptors)
      // when creating a migration for an STI child, we don't want to include notNull;
      // instead, we'll add a check constraint that uses the STI child class name
      const optional = userWantsThisOptional || !!stiChildClassName
      const sqlAttributeType = getAttributeType(attributeType, descriptors)

      let attributeName = snakeify(nonStandardAttributeName)
      if (attributeName === undefined) return acc

      if (attributeType !== undefined && ['has_one', 'has_many'].includes(attributeType)) return acc

      if (attributeType === 'citext') requireCitextExtension = true

      if (stiChildClassName && !userWantsThisOptional) {
        checkConstraints.push(`

  await db.schema
    .alterTable('${table}')
    .addCheckConstraint(
      '${table}_not_null_${attributeName}',
      sql\`type != '${stiChildClassName}' OR ${attributeName} IS NOT NULL\`,
    )
    .execute()`)
      }

      switch (attributeType) {
        case 'belongs_to':
          columnDefs.push(
            generateBelongsToStr(connectionName, attributeName, {
              primaryKeyType,
              optional,
            })
          )
          attributeName = associationNameToForeignKey(attributeName)
          break

        case 'enum':
          columnDefs.push(generateEnumStr(attributeName, { descriptors, optional }))
          break

        case 'decimal':
          columnDefs.push(generateDecimalStr(attributeName, { descriptors, optional }))
          break

        case 'boolean':
          columnDefs.push(generateBooleanStr(attributeName, { optional }))
          break

        case 'encrypted':
          columnDefs.push(generateColumnStr(`encrypted_${attributeName}`, 'text', descriptors, { optional }))
          break

        default:
          if (sqlAttributeType !== undefined) {
            columnDefs.push(generateColumnStr(attributeName, sqlAttributeType, descriptors, { optional }))
          }
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
    .execute()${indexDefs.length ? `\n${newlineIndent}` : ''}${indexDefs.join(newlineDoubleIndent)}${checkConstraints.join('')}
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

function getAttributeType(attributeType: string | undefined, descriptors: string[]) {
  switch (attributeType) {
    case 'string':
      return `varchar(${descriptors[0] || 255})`

    case 'enum':
      return enumAttributeType(descriptors)

    case 'datetime':
      return 'timestamp'

    default:
      return attributeType
  }
}

function enumAttributeType(descriptors: string[]) {
  return `sql\`${descriptors[0]}_enum\``
}

function generateEnumStatements(columnsWithTypes: string[]) {
  const enumStatements = columnsWithTypes.filter(attribute => /:enum:.*:/.test(attribute))
  const finalStatements = compact(
    enumStatements.map(statement => {
      const [, , enumName, ...descriptors] = statement.split(':')
      optionalFromDescriptors(descriptors)
      const columnsWithTypesString = descriptors[0]
      if (columnsWithTypesString === undefined) return
      const columnsWithTypes = columnsWithTypesString.split(/,\s{0,}/)
      return `  await db.schema
    .createType('${enumName}_enum')
    .asEnum([
      ${columnsWithTypes.map(attr => `'${attr}'`).join(',\n      ')}
    ])
    .execute()`
    })
  )

  return finalStatements.length ? finalStatements.join('\n\n') + '\n\n' : ''
}

function generateEnumDropStatements(columnsWithTypes: string[]) {
  const enumStatements = columnsWithTypes.filter(attribute => /:enum:.*:/.test(attribute))
  const finalStatements = compact(
    enumStatements.map(statement => {
      const [, , enumName, ...descriptors] = statement.split(':')
      optionalFromDescriptors(descriptors)
      const columnsWithTypesString = descriptors[0]
      if (columnsWithTypesString === undefined) return
      return `await db.schema.dropType('${enumName}_enum').execute()`
    })
  )

  return finalStatements.length ? '\n\n  ' + finalStatements.join('\n  ') : ''
}

function generateBooleanStr(attributeName: string, { optional }: { optional: boolean }) {
  return `.addColumn('${attributeName}', 'boolean'${optional ? '' : ', col => col.notNull().defaultTo(false)'})`
}

function generateEnumStr(
  attributeName: string,
  { descriptors, optional }: { descriptors: string[]; optional: boolean }
) {
  const computedAttributeType = enumAttributeType(descriptors)
  if (attributeName === undefined) return ''
  return `.addColumn('${attributeName}', ${computedAttributeType}${optional ? '' : ', col => col.notNull()'})`
}

function generateDecimalStr(
  attributeName: string,
  { descriptors, optional }: { descriptors: string[]; optional: boolean }
) {
  const [scale, precision] = descriptors[0]?.split(',') || [null, null]
  if (!scale || !precision) throw new InvalidDecimalFieldPassedToGenerator(attributeName)

  return `.addColumn('${attributeName}', 'decimal(${scale}, ${precision})'${optional ? '' : ', col => col.notNull()'})`
}

function generateColumnStr(
  attributeName: string,
  attributeType: string,
  descriptors: string[],
  { optional }: { optional: boolean }
) {
  let returnStr = `.addColumn('${attributeName}', ${attributeTypeString(attributeType)}`

  const providedDefaultArg = descriptors.find(d => /^default\(/.test(d))
  const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '')
  const notNull = !optional
  const hasExtraValues = providedDefault || notNull

  if (hasExtraValues) returnStr += ', col => col'
  if (notNull) returnStr += '.notNull()'
  if (providedDefault) returnStr += `.defaultTo('${providedDefault}')`

  returnStr = `${returnStr})`

  if (attributeName === STI_TYPE_COLUMN_NAME)
    returnStr = `// CONSIDER: when using type for STI, always use an enum
    // Try using the enum syntax in your generator, e.g.:
    // yarn psy g:model Balloon type:enum:balloon_type:latex,mylar
    ${returnStr}`

  return returnStr
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
  connectionName: string,
  associationName: string,
  {
    primaryKeyType,
    optional = false,
  }: {
    primaryKeyType: PrimaryKeyType
    optional: boolean
  }
) {
  const dbDriverClass = Query.dbDriverClass<Dream>(connectionName)
  const dataType = dbDriverClass.foreignKeyTypeFromPrimaryKey(primaryKeyType)
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

export function optionalFromDescriptors(descriptors: string[]): boolean {
  const optional = descriptors.at(-1) === 'optional'
  if (optional) descriptors.pop()
  return optional
}
