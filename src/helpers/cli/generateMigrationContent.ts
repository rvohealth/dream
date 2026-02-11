import pluralize from 'pluralize-esm'
import Dream from '../../Dream.js'
import lookupModelByGlobalName from '../../dream-app/helpers/lookupModelByGlobalName.js'
import Query from '../../dream/Query.js'
import { POSTGRES_MAX_IDENTIFIER_COMPONENT_BYTES } from '../../errors/IdentifierExceedsMaxLengthForDatabase.js'
import InvalidDecimalFieldPassedToGenerator from '../../errors/InvalidDecimalFieldPassedToGenerator.js'
import { LegacyCompatiblePrimaryKeyType } from '../../types/db.js'
import camelize from '../camelize.js'
import compact from '../compact.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import snakeify from '../snakeify.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import validateDatabaseIdentifierLength from '../validateDatabaseIdentifierLength.js'

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
  primaryKeyType?: LegacyCompatiblePrimaryKeyType | undefined
  createOrAlter?: 'create' | 'alter' | undefined
  stiChildClassName?: string | undefined
} = {}) {
  const altering = createOrAlter === 'alter'
  let requireCitextExtension = false
  const checkConstraints: string[] = []

  if (table) {
    validateDatabaseIdentifierLength(table, {
      isSnakeCase: true,
      identifierType: 'table name',
      maxLength: POSTGRES_MAX_IDENTIFIER_COMPONENT_BYTES,
    })
  }

  const { columnDefs, columnDrops, indexDefs, indexDrops } = columnsWithTypes.reduce(
    (acc: ColumnDefsAndDrops, attributeDeclaration: string) => {
      const { columnDefs, columnDrops, indexDefs, indexDrops } = acc
      const [nonStandardAttributeName, _attributeType, ...descriptors] = attributeDeclaration.split(':')
      if (!nonStandardAttributeName) return acc

      /**
       * Automatically set email columns to citext since different casings of
       * email address are the same email address
       */
      const attributeType = /email$/.test(nonStandardAttributeName)
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
      const omitInlineNonNull = userWantsThisOptional || (!!stiChildClassName && !arrayAttribute)

      if (nonStandardAttributeName === undefined) return acc
      let attributeName = snakeify(nonStandardAttributeName)

      validateDatabaseIdentifierLength(attributeName, {
        isSnakeCase: true,
        identifierType: 'column name',
        maxLength: POSTGRES_MAX_IDENTIFIER_COMPONENT_BYTES,
      })

      switch (processedAttrType) {
        case 'belongsto':
          columnDefs.push(
            generateBelongsToStr(connectionName, attributeName, {
              primaryKeyType,
              omitInlineNonNull,
              originalAssociationName: nonStandardAttributeName,
            })
          )
          attributeName = snakeify(nonStandardAttributeName.split('/').pop()!)
          attributeName = associationNameToForeignKey(attributeName)

          validateDatabaseIdentifierLength(attributeName, {
            isSnakeCase: true,
            identifierType: 'foreign key column name',
            maxLength: POSTGRES_MAX_IDENTIFIER_COMPONENT_BYTES,
          })
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
          validateDatabaseIdentifierLength(`encrypted_${attributeName}`, {
            isSnakeCase: true,
            identifierType: 'encrypted column name',
            maxLength: POSTGRES_MAX_IDENTIFIER_COMPONENT_BYTES,
          })

          columnDefs.push(
            generateColumnStr(`encrypted_${attributeName}`, 'text', descriptors, {
              omitInlineNonNull,
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
        const indexName = `${table}_${attributeName}`

        validateDatabaseIdentifierLength(indexName, {
          isSnakeCase: true,
          identifierType: 'index name',
        })

        indexDefs.push(`await db.schema
    .createIndex('${indexName}')
    .on('${table}')
    .column('${attributeName}')
    .execute()`)

        indexDrops.push(`await db.schema.dropIndex('${indexName}').execute()`)
      }

      if (stiChildClassName && !userWantsThisOptional && !arrayAttribute) {
        const constraintName = `${table}_not_null_${attributeName}`

        validateDatabaseIdentifierLength(constraintName, {
          isSnakeCase: true,
          identifierType: 'check constraint name',
        })

        checkConstraints.push(`

  await db.schema
    .alterTable('${table}')
    .addCheckConstraint(
      '${constraintName}',
      sql\`type != '${stiChildClassName}' OR ${attributeName} IS NOT NULL\`,
    )
    .execute()`)
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
  const dreamDbImports: string[] = []
  if (requireCitextExtension) dreamDbImports.push('DreamMigrationHelpers')

  const newlineIndent = '\n  '
  const newlineDoubleIndent = '\n    '
  const doubleNewlineIndent = '\n\n  '
  const columnDefLines = columnDefs.length ? newlineDoubleIndent + columnDefs.join(newlineDoubleIndent) : ''
  const columnDropLines = columnDrops.length
    ? newlineDoubleIndent + columnDrops.join(newlineDoubleIndent) + newlineDoubleIndent
    : ''

  return `\
${dreamDbImports.length ? `import { ${dreamDbImports.join(', ')} } from '@rvoh/dream/db'\n` : ''}import { ${kyselyImports.join(', ')} } from 'kysely'

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
    .execute()${indexDefs.length ? `\n${newlineIndent}` : ''}${indexDefs.join(doubleNewlineIndent)}${checkConstraints.join('')}
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
  return `sql\`${descriptors[0]}_enum${suffix}\``
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

      const enumTypeName = `${enumName}_enum`
      validateDatabaseIdentifierLength(enumTypeName, {
        isSnakeCase: true,
        identifierType: 'enum type name',
      })

      return `  await db.schema
    .createType('${enumTypeName}')
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
      return `await db.schema.dropType('${enumName}_enum').execute()`
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
  { omitInlineNonNull: optional }: { omitInlineNonNull: boolean }
) {
  let returnStr = `.addColumn('${attributeName}', ${attributeTypeString(attributeType)}`

  const providedDefaultArg = descriptors.find(d => /^default\(/.test(d))
  const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '')
  const notNull = !optional
  const isUnique = /(email|token|uuid)$/.test(attributeName)
  const hasExtraValues = providedDefault || notNull || isUnique
  const isArray = /\[\]$/.test(attributeType)

  if (hasExtraValues) returnStr += ', col => col'
  if (notNull) returnStr += '.notNull()'
  if (isUnique) returnStr += '.unique()'
  if (providedDefault) returnStr += `.defaultTo('${providedDefault}')`
  else if (isArray) returnStr += `.defaultTo('{}')`

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
  }: {
    primaryKeyType: LegacyCompatiblePrimaryKeyType
    omitInlineNonNull: boolean
    originalAssociationName?: string
  }
) {
  const dbDriverClass = Query.dbDriverClass<Dream>(connectionName)
  const dataType = dbDriverClass.foreignKeyTypeFromPrimaryKey(primaryKeyType)
  const references = lookupReferencesTable(associationName, originalAssociationName)
  return `.addColumn('${associationNameToForeignKey(associationName.split('/').pop()!)}', '${dataType}', col => col.references('${references}.id').onDelete('restrict')${optional ? '' : '.notNull()'})`
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

    default:
      return `.addColumn('id', '${primaryKeyType}', col => col.primaryKey())`
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

export function optionalFromDescriptors(descriptors: string[]): boolean {
  const optional = descriptors.at(-1) === 'optional'
  if (optional) descriptors.pop()
  return optional
}
