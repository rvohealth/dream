import { ColumnDataType, Kysely, RawBuilder, sql } from 'kysely'

export default async function dropValueFromEnum(
  db: Kysely<any>,
  { enumName, enumValueToDrop, tablesAndColumnsToChange }: DropValueFromEnumOpts
) {
  // temporarily set all table columns depending on this enum to an acceptable alternate type
  for (const tableAndColumnToChange of tablesAndColumnsToChange) {
    const tableAndColumnToChangeAsArray = tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray
    const isArray = tableAndColumnToChangeAsArray.array || false
    if (
      isArray &&
      tableAndColumnToChangeAsArray.behavior === 'replace' &&
      !tableAndColumnToChangeAsArray.replaceWith
    ) {
      throw new Error(
        `
When calling dropValueFromEnum, you must provide a "replaceWith" value whenever using behavior: "replace"
`
      )
    }

    await db.schema
      .alterTable(tableAndColumnToChange.table)
      .alterColumn(tableAndColumnToChange.column, col => col.setDataType(computedTemporaryType(isArray)))
      .execute()
  }

  // collect enum values before dropping type
  const allEnumValues = await getEnumValues(db, enumName)

  // drop type and re-create it without the enum value
  // we are trying to drop
  await db.schema.dropType(enumName).execute()
  await db.schema
    .createType(enumName)
    .asEnum(allEnumValues.filter(val => val !== enumValueToDrop))
    .execute()

  for (const tableAndColumnToChange of tablesAndColumnsToChange) {
    const isArray = (tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray).array || false
    const rawTemporarilySetTo = computedTemporaryType(isArray)

    const temporarilySetTo: string = (rawTemporarilySetTo as RawBuilder<unknown>)?.compile
      ? (rawTemporarilySetTo as RawBuilder<unknown>).compile(db).sql
      : (rawTemporarilySetTo as string)

    // if temporarilySetTo ends with [] (i.e. text[]), this means
    // that the value it is replacing was originally an enum array
    const columnIsArrayType = /\[\]$/.test(temporarilySetTo)

    if (columnIsArrayType) {
      await replaceVulnerableArrayValues(db, enumValueToDrop, tableAndColumnToChange)
      await updateTableColumnToNewEnumArrayType(db, enumName, tableAndColumnToChange)
    } else {
      await replaceVulnerableValues(db, enumValueToDrop, tableAndColumnToChange)
      await updateTableColumnToNewEnumType(db, enumName, tableAndColumnToChange)
    }
  }
}

async function getEnumValues(db: Kysely<any>, enumName: string) {
  const response = await sql`SELECT unnest(enum_range(NULL::${sql.raw(enumName)}))`.execute(db)
  return response.rows.map(row => (row as any).unnest)
}

// finds any records in the specified table
// who's targeted column is an array containing
// the enum value we are trying to drop,
// and updates their values to a safe value
// provided by the user
async function replaceVulnerableArrayValues(
  db: Kysely<any>,
  enumValueToDrop: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumns
) {
  const temporarilySetTo = computeTemporarilySetToValue(tableAndColumnToChange)
  const setExistingUsesOfValueTo = computedAlternateValue(tableAndColumnToChange)

  const { column, table } = tableAndColumnToChange

  if (setExistingUsesOfValueTo === null) {
    await sql`
      UPDATE ${sql.raw(table)}
      SET ${sql.raw(column)} = (select array_remove(${sql.raw(column)}, '${sql.raw(enumValueToDrop)}') from ${sql.raw(table)})
      WHERE '${sql.raw(enumValueToDrop)}'::${sql.raw(temporarilySetTo.replace(/\[\]$/, ''))} = ANY(${sql.raw(column)})
    `.execute(db)
  } else {
    await sql`
      UPDATE ${sql.raw(table)}
      SET ${sql.raw(column)} = (
        SELECT array_replace(${sql.raw(column)}, '${sql.raw(enumValueToDrop)}', '${sql.raw(setExistingUsesOfValueTo)}')
        FROM ${sql.raw(table)}
      )
      WHERE '${sql.raw(enumValueToDrop)}'::${sql.raw(temporarilySetTo.replace(/\[\]$/, ''))} = ANY(${sql.raw(column)})
    `.execute(db)
  }
}

// finds any records in the specified table
// who's targeted column is  the enum value
// we are trying to drop, and updates their
// values to a safe value provided by
// the user
async function replaceVulnerableValues(
  db: Kysely<any>,
  enumValueToDrop: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumns
) {
  const temporarilySetTo = computeTemporarilySetToValue(tableAndColumnToChange)
  const { table, column, replaceWith } = tableAndColumnToChange

  if (replaceWith) {
    await sql`
      UPDATE ${sql.raw(table)}
      SET ${sql.raw(column)} = '${sql.raw(replaceWith)}'
      WHERE '${sql.raw(enumValueToDrop)}'::${sql.raw(temporarilySetTo)} = ${sql.raw(column)}
    `.execute(db)
  } else {
    await sql`
      UPDATE ${sql.raw(table)}
      SET ${sql.raw(column)} = null
      WHERE '${sql.raw(enumValueToDrop)}'::${sql.raw(temporarilySetTo)} = ${sql.raw(column)}
    `.execute(db)
  }
}

// updates the table's targeted column to the newly-created enum array
async function updateTableColumnToNewEnumArrayType(
  db: Kysely<any>,
  enumName: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumns
) {
  const { table, column } = tableAndColumnToChange
  await sql`
    ALTER TABLE ${sql.raw(table)}
    ALTER ${sql.raw(column)}
    TYPE ${sql.raw(enumName)}[]
    USING ${sql.raw(column)}::${sql.raw(enumName)}[];
  `.execute(db)
}

// updates the table's targeted column to the newly-created enum
async function updateTableColumnToNewEnumType(
  db: Kysely<any>,
  enumName: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumns
) {
  const { table, column } = tableAndColumnToChange
  await sql`
    ALTER TABLE ${sql.raw(table)}
    ALTER ${sql.raw(column)}
    TYPE ${sql.raw(enumName)}
    USING ${sql.raw(column)}::${sql.raw(enumName)};
  `.execute(db)
}

function computedAlternateValue(tableAndColumnToChange: DropValueFromEnumTablesAndColumns) {
  const tableAndColumnToChangeAsArray = tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray

  if (tableAndColumnToChangeAsArray.array && tableAndColumnToChangeAsArray.behavior === 'remove') {
    return null
  }

  return tableAndColumnToChange.replaceWith || null
}

// the user can provide a value to set the column to. This will either be a
// string (i.e. text) or a RawBuilder statement (i.e. sql`text[]`).
// This function will grab the raw string value for either of these types.
function computeTemporarilySetToValue(tableAndColumnToChange: DropValueFromEnumTablesAndColumns) {
  return (tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray).array ? 'text[]' : 'text'
}

function computedTemporaryType(array: boolean): ColumnDataType | RawBuilder<unknown> {
  if (array) return sql`text[]`
  return 'text'
}

export interface DropValueFromEnumOpts {
  enumName: string
  enumValueToDrop: string
  tablesAndColumnsToChange: DropValueFromEnumTablesAndColumns[]
}

export type DropValueFromEnumTablesAndColumns =
  | DropValueFromEnumTablesAndColumnsForArray
  | DropValueFromEnumTablesAndColumnsForNonArray

export type DropValueFromEnumTablesAndColumnsForArray = {
  table: string
  column: string
  array: true
  behavior: 'remove' | 'replace'
  replaceWith?: string
}

export type DropValueFromEnumTablesAndColumnsForNonArray = {
  table: string
  column: string
  replaceWith: string | null
}
