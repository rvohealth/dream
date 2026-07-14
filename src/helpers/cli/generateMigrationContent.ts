import pluralize from 'pluralize-esm'
import Dream from '../../Dream.js'
import lookupModelByGlobalName from '../../dream-app/helpers/lookupModelByGlobalName.js'
import Query from '../../dream/Query.js'
import InvalidDecimalFieldPassedToGenerator from '../../errors/InvalidDecimalFieldPassedToGenerator.js'
import { LegacyCompatiblePrimaryKeyType } from '../../types/db.js'
import camelize from '../camelize.js'
import compact from '../compact.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import snakeify from '../snakeify.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'

const STI_TYPE_COLUMN_NAME = 'type'
// deleted_at is deliberately NOT in this list: the SoftDelete default scope's
// `WHERE deleted_at IS NULL` is unselective on healthy tables, Dream internals
// never issue a query a deleted_at index could serve, and the useful partial
// index alternatives are dialect-specific SQL the generator must not emit by
// default. See spec/unit/cli/generateMigrationContent.spec.ts
// ("deleted_at is deliberately NOT indexed") and the CHANGELOG.
const COLUMNS_TO_INDEX = [STI_TYPE_COLUMN_NAME]

interface ColumnDefsAndDrops {
  columnDefs: string[]
  columnDrops: string[]
  indexDefs: string[]
}

export default function generateMigrationContent({
  connectionName = 'default',
  table,
  columnsWithTypes = [],
  primaryKeyType = 'bigserial',
  createOrAlter = 'create',
  stiChildClassName,
  softDelete = false,
}: {
  connectionName?: string
  table?: string | undefined
  columnsWithTypes?: string[] | undefined
  primaryKeyType?: LegacyCompatiblePrimaryKeyType | undefined
  createOrAlter?: 'create' | 'alter' | undefined
  stiChildClassName?: string | undefined
  /**
   * When true (and creating a new table), auto-emits a nullable `deleted_at`
   * column alongside `created_at` / `updated_at`. Ignored in alter mode and
   * for STI child migrations.
   */
  softDelete?: boolean
} = {}) {
  const altering = createOrAlter === 'alter'
  let requireCitextExtension = false
  const checkConstraints: string[] = []

  // When creating a new table, we automatically emit `created_at`,
  // `updated_at`, and (when soft delete is on) `deleted_at` columns. Filter
  // these out of the user-supplied column list so we don't emit duplicate
  // `.addColumn(...)` calls if the user also specified them explicitly.
  const userExplicitlyPassedDeletedAt =
    !altering && columnsWithTypes.some(col => (col.split(':')[0] ?? '') === 'deleted_at')
  const processedColumnsWithTypes = altering
    ? columnsWithTypes
    : columnsWithTypes.filter(col => {
        const name = col.split(':')[0] ?? ''
        return name !== 'created_at' && name !== 'updated_at' && name !== 'deleted_at'
      })
  const emitDeletedAtColumn = !altering && (softDelete || userExplicitlyPassedDeletedAt)

  const { columnDefs, columnDrops, indexDefs } = processedColumnsWithTypes.reduce(
    (acc: ColumnDefsAndDrops, attributeDeclaration: string) => {
      const { columnDefs, columnDrops, indexDefs } = acc
      const [rawSegmentOne, _attributeType, ...descriptors] = attributeDeclaration.split(':')
      if (!rawSegmentOne) return acc

      // Extract optional `@alias` from segment-1 (Model@alias:belongs_to form).
      // The model name (without alias) is what gets standardized / referenced
      // by table lookup; the alias drives the column / index naming when present.
      const atIdx = rawSegmentOne.indexOf('@')
      const aliasName = atIdx !== -1 ? rawSegmentOne.slice(atIdx + 1) : undefined
      const nonStandardAttributeName = atIdx !== -1 ? rawSegmentOne.slice(0, atIdx) : rawSegmentOne
      if (!nonStandardAttributeName) return acc
      if (atIdx !== -1 && !aliasName) return acc

      /**
       * Automatically set email columns to citext since different casings of
       * email address are the same email address. Skip this when the user
       * explicitly asked for an encrypted column, since encrypted columns
       * are always stored as encrypted text and must not be overridden by
       * the name-based heuristic.
       */
      const attributeType =
        _attributeType === 'encrypted' || _attributeType === 'encrypted[]'
          ? _attributeType
          : /email$/.test(nonStandardAttributeName)
            ? 'citext'
            : /uuid$/.test(nonStandardAttributeName)
              ? 'uuid'
              : _attributeType
      const processedAttrType = camelize(attributeType)?.toLowerCase()

      const userWantsThisOptional = optionalFromDescriptors(descriptors)
      // when creating a migration for an STI child, we don't want to include notNull;
      // instead, we'll add a check constraint that uses the STI child class name
      const sqlAttributeType = getAttributeType(attributeType, descriptors)

      if (attributeType === undefined || ['hasone', 'hasmany'].includes(processedAttrType!)) return acc
      if (attributeType === 'citext') requireCitextExtension = true

      const arrayAttribute = /\[\]$/.test(attributeType)
      // Booleans always have a sensible non-null default (`false`), so in an
      // STI child migration we keep the straightforward `.notNull().defaultTo(false)`
      // column definition and skip the per-type check constraint — same as
      // arrays, which already default to `'{}'`.
      const isBooleanColumn = processedAttrType === 'boolean'
      const omitInlineNonNull =
        userWantsThisOptional || (!!stiChildClassName && !arrayAttribute && !isBooleanColumn)

      if (nonStandardAttributeName === undefined) return acc
      let attributeName: string = snakeify(nonStandardAttributeName)

      switch (processedAttrType) {
        case 'belongsto':
          columnDefs.push(
            generateBelongsToStr(connectionName, attributeName, {
              primaryKeyType,
              omitInlineNonNull,
              originalAssociationName: nonStandardAttributeName,
              aliasName,
            })
          )
          // Resolve the actual column name used for index + drop emission.
          // When an alias is present (Model@alias:belongs_to), the column is
          // `${alias}_id`; otherwise it's derived from the model's last segment.
          attributeName = aliasName
            ? snakeify(aliasName)
            : snakeify(nonStandardAttributeName.split('/').pop()!)
          attributeName = associationNameToForeignKey(attributeName)
          break

        case 'enum':
          columnDefs.push(generateEnumStr(attributeName, { descriptors, omitInlineNonNull }))
          break

        case 'enum[]':
          columnDefs.push(
            generateEnumStr(attributeName, {
              descriptors,
              omitInlineNonNull,
              asArray: true,
            })
          )
          break

        case 'decimal':
          columnDefs.push(generateDecimalStr(attributeName, { descriptors, omitInlineNonNull }))
          break

        case 'decimal[]':
          columnDefs.push(
            generateDecimalStr(attributeName, {
              descriptors,
              omitInlineNonNull,
              asArray: true,
            })
          )
          break

        // array case for booleans can be handled with the default block.
        // the only thing that is customized for a boolean field is the default
        // value, which doesn't need to be special for boolean[]
        case 'boolean':
          columnDefs.push(generateBooleanStr(attributeName, { omitInlineNonNull }))
          break

        case 'encrypted':
          attributeName = `encrypted_${attributeName}`
          columnDefs.push(
            generateColumnStr(attributeName, 'text', descriptors, {
              omitInlineNonNull,
              skipUniqueHeuristic: true,
            })
          )
          break

        // TODO: determine if we need to support encrypted[] in the future
        case 'encrypted[]':
          throw new Error('the "encrypted[]" column type is not supported')

        default:
          if (sqlAttributeType !== undefined) {
            columnDefs.push(
              generateColumnStr(attributeName, sqlAttributeType, descriptors, {
                omitInlineNonNull,
              })
            )
          }
          break
      }

      columnDrops.push(`.dropColumn('${attributeName}')`)

      if (processedAttrType === 'belongsto' || COLUMNS_TO_INDEX.includes(attributeName)) {
        indexDefs.push(columnIndexStatement(table, attributeName))
      }

      if (stiChildClassName && !userWantsThisOptional && !arrayAttribute && !isBooleanColumn) {
        checkConstraints.push(`

  await db.schema
    .alterTable('${table}')
    .addCheckConstraint(
      '${table}_not_null_${attributeName}',
      sql\`type != '${stiChildClassName}' OR ${attributeName} IS NOT NULL\`,
    )
    .execute()`)
      }

      return acc
    },
    { columnDefs: [], columnDrops: [], indexDefs: [] } as ColumnDefsAndDrops
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
  const dreamDbImports: string[] = []
  if (requireCitextExtension) dreamDbImports.push('DreamMigrationHelpers')

  const newlineIndent = '\n  '
  const newlineDoubleIndent = '\n    '
  const doubleNewlineIndent = '\n\n  '
  const columnDefLines = columnDefs.length ? newlineDoubleIndent + columnDefs.join(newlineDoubleIndent) : ''
  const columnDropLines = columnDrops.length
    ? newlineDoubleIndent + columnDrops.join(newlineDoubleIndent) + newlineDoubleIndent
    : ''

  const timestampColumnLines = altering
    ? ''
    : newlineDoubleIndent +
      ".addColumn('created_at', 'timestamp', col => col.notNull())" +
      newlineDoubleIndent +
      ".addColumn('updated_at', 'timestamp', col => col.notNull())" +
      (emitDeletedAtColumn ? newlineDoubleIndent + ".addColumn('deleted_at', 'timestamp')" : '')

  return `\
${dreamDbImports.length ? `import { ${dreamDbImports.join(', ')} } from '@rvoh/dream/db'\n` : ''}import { ${kyselyImports.join(', ')} } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
${citextExtension}${generateEnumStatements(columnsWithTypes)}  await db.schema
    .${altering ? 'alterTable' : 'createTable'}('${table}')${
      altering ? '' : newlineDoubleIndent + generateIdStr({ primaryKeyType })
    }${columnDefLines}${timestampColumnLines}
    .execute()${indexDefs.length ? `\n${newlineIndent}` : ''}${indexDefs.join(doubleNewlineIndent)}${checkConstraints.join('')}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  ${
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

    case 'string[]':
      return `varchar(${descriptors[0] || 255})[]`

    case 'enum':
      return enumAttributeType(descriptors)

    case 'enum[]':
      return enumAttributeType(descriptors, true)

    case 'datetime':
      return 'timestamp'

    default:
      return attributeType
  }
}

function enumAttributeType(descriptors: string[], asArray: boolean = false) {
  const suffix = asArray ? '[]' : ''
  return `sql\`${appendEnumSuffix(descriptors[0])}${suffix}\``
}

function appendEnumSuffix(name: string | undefined) {
  return name?.endsWith('_enum') ? name : `${name}_enum`
}

const ENUM_OR_ENUM_ARRAY_REGEX = /:enum:.*:|:enum\[\]:.*:/

function generateEnumStatements(columnsWithTypes: string[]) {
  const enumStatements = columnsWithTypes.filter(attribute => ENUM_OR_ENUM_ARRAY_REGEX.test(attribute))
  const finalStatements = compact(
    enumStatements.map(statement => {
      const [, , enumName, ...descriptors] = statement.split(':')
      optionalFromDescriptors(descriptors)
      const columnsWithTypesString = descriptors[0]
      if (columnsWithTypesString === undefined) return
      const columnsWithTypes = columnsWithTypesString.split(/,\s{0,}/)
      return `  await db.schema
    .createType('${appendEnumSuffix(enumName)}')
    .asEnum([
      ${columnsWithTypes.map(attr => `'${attr}'`).join(',\n      ')}
    ])
    .execute()`
    })
  )

  return finalStatements.length ? finalStatements.join('\n\n') + '\n\n' : ''
}

function generateEnumDropStatements(columnsWithTypes: string[]) {
  const enumStatements = columnsWithTypes.filter(attribute => ENUM_OR_ENUM_ARRAY_REGEX.test(attribute))
  const finalStatements = compact(
    enumStatements.map(statement => {
      const [, , enumName, ...descriptors] = statement.split(':')
      optionalFromDescriptors(descriptors)
      const columnsWithTypesString = descriptors[0]
      if (columnsWithTypesString === undefined) return
      return `await db.schema.dropType('${appendEnumSuffix(enumName)}').execute()`
    })
  )

  return finalStatements.length ? '\n\n  ' + finalStatements.join('\n  ') : ''
}

function generateBooleanStr(
  attributeName: string,
  { omitInlineNonNull: optional }: { omitInlineNonNull: boolean }
) {
  return `.addColumn('${attributeName}', 'boolean'${optional ? '' : ', col => col.notNull().defaultTo(false)'})`
}

function generateEnumStr(
  attributeName: string,
  {
    descriptors,
    omitInlineNonNull: optional,
    asArray = false,
  }: { descriptors: string[]; omitInlineNonNull: boolean; asArray?: boolean }
) {
  const computedAttributeType = enumAttributeType(descriptors, asArray)
  if (attributeName === undefined) return ''

  const columnModifiers = asArray ? "col.notNull().defaultTo('{}')" : 'col.notNull()'
  return `.addColumn('${attributeName}', ${computedAttributeType}${optional ? '' : `, col => ${columnModifiers}`})`
}

function generateDecimalStr(
  attributeName: string,
  {
    descriptors,
    omitInlineNonNull: optional,
    asArray = false,
  }: { descriptors: string[]; omitInlineNonNull: boolean; asArray?: boolean }
) {
  const [scale, precision] = descriptors[0]?.split(',') || [null, null]
  if (!scale || !precision) throw new InvalidDecimalFieldPassedToGenerator(attributeName)

  const columnModifiers = asArray ? "col.notNull().defaultTo('{}')" : 'col.notNull()'
  const decimalStatement = asArray
    ? `sql\`decimal(${scale}, ${precision})[]\``
    : `'decimal(${scale}, ${precision})'`
  return `.addColumn('${attributeName}', ${decimalStatement}${optional ? '' : `, col => ${columnModifiers}`})`
}

function generateColumnStr(
  attributeName: string,
  attributeType: string,
  descriptors: string[],
  {
    omitInlineNonNull: optional,
    skipUniqueHeuristic = false,
  }: { omitInlineNonNull: boolean; skipUniqueHeuristic?: boolean }
) {
  let returnStr = `.addColumn('${attributeName}', ${attributeTypeString(attributeType)}`

  const providedDefaultArg = descriptors.find(d => /^default\(/.test(d))
  const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '')
  const notNull = !optional
  const isUnique = !skipUniqueHeuristic && /(email|token|uuid)$/.test(attributeName)
  const hasExtraValues = providedDefault || notNull || isUnique
  const isArray = /\[\]$/.test(attributeType)

  const needsJsonDefault = notNull && !isArray && (attributeType === 'jsonb' || attributeType === 'json')

  if (hasExtraValues) returnStr += ', col => col'
  if (notNull) returnStr += '.notNull()'
  if (isUnique) returnStr += '.unique()'
  if (providedDefault) returnStr += `.defaultTo('${providedDefault}')`
  else if (isArray) returnStr += `.defaultTo('{}')`
  // jsonb / json columns get an empty-object default so calling create() on a
  // model without explicitly setting the column doesn't trip NOT NULL. Mirrors
  // the existing boolean → false and array → '{}' auto-defaults. Optional
  // jsonb columns skip the default since null is the intended initial state.
  else if (needsJsonDefault) returnStr += `.defaultTo(sql\`'{}'::${attributeType}\`)`

  returnStr = `${returnStr})`

  if (attributeName === STI_TYPE_COLUMN_NAME)
    returnStr = `// CONSIDER: when using type for STI, always use an enum
    // Try using the enum syntax in your generator, e.g.:
    // pnpm psy g:model Balloon type:enum:balloon_type:latex,mylar
    ${returnStr}`

  return returnStr
}

function attributeTypeString(attributeType: string) {
  const attributeTypesRequiringSql = ['citext']
  if (attributeTypesRequiringSql.includes(attributeType)) return `sql\`${attributeType}\``

  const isArray = /\[\]$/.test(attributeType)

  switch (attributeType) {
    case 'varbit':
    case 'bitvarying':
      return "'bit varying'"
    case 'txid_snapshot':
      return "'txid_snapshot'"
    default:
      if (isArray) {
        return `sql\`${attributeType.replace(/_/g, ' ')}\``
      } else {
        return `'${attributeType.replace(/_/g, ' ')}'`
      }
  }
}

function generateBelongsToStr(
  connectionName: string,
  associationName: string,
  {
    primaryKeyType,
    omitInlineNonNull: optional = false,
    originalAssociationName,
    aliasName,
  }: {
    primaryKeyType: LegacyCompatiblePrimaryKeyType
    omitInlineNonNull: boolean
    originalAssociationName?: string
    aliasName?: string | undefined
  }
) {
  const dbDriverClass = Query.dbDriverClass<Dream>(connectionName)
  const dataType = dbDriverClass.foreignKeyTypeFromPrimaryKey(primaryKeyType)
  const references = lookupReferencesTable(associationName, originalAssociationName)
  // When the user passed `Model@alias:belongs_to`, the column name comes from
  // the alias; otherwise it's the model's last segment (existing behavior).
  const columnNameSource = aliasName ? snakeify(aliasName) : associationName.split('/').pop()!
  return `.addColumn('${associationNameToForeignKey(columnNameSource)}', '${dataType}', col => col.references('${references}.id').onDelete('restrict')${optional ? '' : '.notNull()'})`
}

function generateIdStr({ primaryKeyType }: { primaryKeyType: LegacyCompatiblePrimaryKeyType }) {
  switch (primaryKeyType) {
    case 'uuid7':
      return `\
.addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql\`uuidv7()\`),
    )`

    case 'uuid4':
      return `\
.addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql\`gen_random_uuid()\`),
    )`

    case 'uuid':
      return `\
.addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql\`uuid_generate_v4()\`),
    )`

    case 'integer':
      return `.addColumn('id', 'integer', col => col.primaryKey().generatedByDefaultAsIdentity())`

    case 'bigint':
    case 'bigserial':
    default:
      return `.addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())`
  }
}

/**
 * Determines the referenced table name for a belongs_to association.
 * First tries to look up the actual model to get its table name (handles
 * custom table name overrides). Falls back to deriving the table name
 * from the association string if the model isn't found.
 */
function lookupReferencesTable(
  snakeAssociationName: string,
  originalAssociationName: string | undefined
): string {
  if (originalAssociationName) {
    try {
      const globalName = globalClassNameFromFullyQualifiedModelName(
        standardizeFullyQualifiedModelName(originalAssociationName)
      )
      const model = lookupModelByGlobalName(globalName)
      if (model?.table) {
        return model.table as string
      }
    } catch {
      // Model not found or DreamApp not initialized — fall through to string derivation
    }
  }

  return pluralize(snakeAssociationName.replace(/\//g, '_').replace(/_id$/, ''))
}

function associationNameToForeignKey(associationName: string) {
  return snakeify(associationName.replace(/\//g, '_').replace(/_id$/, '') + '_id')
}

function columnIndexStatement(table: string | undefined, attributeName: string) {
  const indexName = `${table}_${attributeName}`

  return `await db.schema
    .createIndex('${indexName}')
    .on('${table}')
    .column('${attributeName}')
    .execute()`
}

export function optionalFromDescriptors(descriptors: string[]): boolean {
  const optional = descriptors.at(-1) === 'optional'
  if (optional) descriptors.pop()
  return optional
}
