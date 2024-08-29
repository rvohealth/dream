import { ColumnDataType, Kysely, RawBuilder, sql } from 'kysely'

export default async function dropValueFromEnum(
  db: Kysely<any>,
  { enumName, enumValueToDrop, tablesAndColumnsToChange }: DropValueFromEnumOpts
) {
  // temporarily set all table columns depending on this enum to an acceptable alternate type
  for (const tableAndColumnToChange of tablesAndColumnsToChange) {
    const tableAndColumnToChangeAsArray =
      tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArrayBase
    const isArray = tableAndColumnToChangeAsArray.array || false

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

    if (isArray) {
      await replaceVulnerableArrayValues(
        db,
        enumValueToDrop,
        tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray
      )
      await updateTableColumnToNewEnumArrayType(db, enumName, tableAndColumnToChange)
    } else {
      await replaceVulnerableValues(
        db,
        enumValueToDrop,
        tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForNonArray
      )
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
  tableAndColumnToChange: DropValueFromEnumTablesAndColumnsForArray
) {
  const { column, table } = tableAndColumnToChange

  await db
    .updateTable(table)
    .set({
      [column]:
        tableAndColumnToChange.behavior === 'remove'
          ? sql.raw(`array_remove(${column}, '${enumValueToDrop}')`)
          : sql.raw(
              `array_replace(${column}, '${enumValueToDrop}', '${tableAndColumnToChange.replaceWith}')`
            ),
    })
    .where(sql.raw(`'${enumValueToDrop}'`), '=', sql.raw(`ANY(${column})`))
    .execute()
}

// finds any records in the specified table
// who's targeted column is  the enum value
// we are trying to drop, and updates their
// values to a safe value provided by
// the user
async function replaceVulnerableValues(
  db: Kysely<any>,
  enumValueToDrop: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumnsForNonArray
) {
  const { table, column, replaceWith } = tableAndColumnToChange

  await db
    .updateTable(table)
    .set({ [column]: replaceWith })
    .where(column, '=', enumValueToDrop)
    .execute()
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
  | DropValueWithRemovalFromEnumTablesAndColumnsForArray
  | DropValueWithReplacementFromEnumTablesAndColumnsForArray
  | DropValueFromEnumTablesAndColumnsForNonArray

interface DropValueFromEnumTablesAndColumnsForArrayBase {
  table: string
  column: string
  array: true
}

export interface DropValueWithRemovalFromEnumTablesAndColumnsForArray
  extends DropValueFromEnumTablesAndColumnsForArrayBase {
  behavior: 'replace'
  replaceWith: string
}

export interface DropValueWithReplacementFromEnumTablesAndColumnsForArray
  extends DropValueFromEnumTablesAndColumnsForArrayBase {
  behavior: 'remove'
}

type DropValueFromEnumTablesAndColumnsForArray =
  | DropValueWithRemovalFromEnumTablesAndColumnsForArray
  | DropValueWithReplacementFromEnumTablesAndColumnsForArray

export type DropValueFromEnumTablesAndColumnsForNonArray = {
  table: string
  column: string
  replaceWith: string | null
}
