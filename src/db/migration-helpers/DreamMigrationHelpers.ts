import { ColumnDataType, Kysely, RawBuilder, sql } from 'kysely'

export default class DreamMigrationHelpers {
  /**
   * Rename a table and its associated primary key sequence.
   *
   * This method renames both the table and its primary key sequence to keep them
   * in sync. When PostgreSQL creates a table with a serial or bigserial primary key,
   * it automatically creates a sequence named `{tablename}_id_seq`. If you only rename
   * the table, the sequence keeps the old name, which can cause confusion and issues.
   *
   * This method is only suitable for tables that have a serial or bigserial primary
   * key column named 'id'.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param from - The current name of the table to rename
   * @param to - The new name for the table
   */
  public static async renameTable(db: Kysely<any>, from: string, to: string) {
    await db.schema.alterTable(from).renameTo(to).execute()
    await sql`ALTER SEQUENCE ${from}_id_seq RENAME TO ${to}_id_seq`.execute(db)
  }

  /**
   * Unique indexes cannot be populated by the same value even within a transaction,
   * but deferrable unique constraints can.
   *
   * The Sortable decorator requires deferrable unique constraints rather than unique
   * indexes.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param constraintName - The name of the constraint to create
   * @param options - Configuration options
   * @param options.table - The name of the table
   * @param options.columns - The names of the columns to include in the constraint
   *
   */
  public static async addDeferrableUniqueConstraint(
    db: Kysely<any>,
    constraintName: string,
    {
      table,
      columns,
    }: {
      table: string
      columns: string[]
    }
  ) {
    await this.dropConstraint(db, constraintName, { table })
    await sql`
    ALTER TABLE ${sql.table(table)}
    ADD CONSTRAINT ${sql.table(constraintName)}
      UNIQUE (${sql.raw(columns.join(', '))})
      DEFERRABLE INITIALLY DEFERRED;
  `.execute(db)
  }

  /**
   * Add a value to an enum.
   *
   * Note that this always includes "IF NOT EXISTS", so is safe to re-run multiple times.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param __namedParameters - The options for adding the enum value
   * @param __namedParameters.enumName - The name of the enum to modify
   * @param __namedParameters.value - The name of the value to add to the enum
   */
  public static async addEnumValue(db: Kysely<any>, { enumName, value }: AddValueToEnumOpts) {
    await sql`ALTER TYPE ${sql.raw(enumName)} ADD VALUE IF NOT EXISTS '${sql.raw(value)}';`.execute(db)
  }

  /**
   * Create a database extension.
   *
   * ```
   *   // Add the case insensitive extension
   *   await DreamMigrationHelpers.createExtension(db, 'citext')
   *
   *   // Add the pg trigram extension
   *   await DreamMigrationHelpers.createExtension(db, 'pg_trgm')
   * ```
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param extensionName - The name of the database extension to add
   * @param options - Configuration options
   * @param options.ifNotExists - Only add the extension if it doesn't already exist
   * @param options.publicSchema - Create using the public schema
   *
   */
  public static async createExtension(
    db: Kysely<any>,
    extensionName: string,
    { ifNotExists = true, publicSchema = true }: { ifNotExists?: boolean; publicSchema?: boolean } = {}
  ) {
    const ifNotExistsText = ifNotExists ? ' IF NOT EXISTS ' : ' '
    const publicSchemaText = publicSchema ? ' WITH SCHEMA public' : ''
    await sql`
    CREATE EXTENSION${sql.raw(ifNotExistsText)}"${sql.raw(extensionName)}"${sql.raw(publicSchemaText)};
  `.execute(db)
  }

  /**
   * Create a gin index
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param indexName - The name of the constraint to create
   * @param options - Configuration options
   * @param options.table - The name of the table
   * @param options.column - The name of the column to index
   *
   */
  public static async createGinIndex(
    db: Kysely<any>,
    indexName: string,
    { table, column }: { table: string; column: string }
  ) {
    await sql`
    CREATE INDEX IF NOT EXISTS ${sql.raw(indexName)} ON ${sql.raw(table)} USING GIN (${sql.raw(
      `${column} gin_trgm_ops`
    )});
  `.execute(db)
  }

  /**
   * Drop a constraint
   *
   * Note that this always includes "IF NOT EXISTS", so is safe to re-run multiple times.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param constraintName - The name of the constraint to create
   * @param options - Configuration options
   * @param options.table - The name of the table
   *
   */
  public static async dropConstraint(db: Kysely<any>, constraintName: string, { table }: { table: string }) {
    await sql`
    ALTER TABLE ${sql.table(table)} DROP CONSTRAINT IF EXISTS ${sql.table(constraintName)};
  `.execute(db)
  }

  /**
   * Forces a new transaction boundary in migration execution.
   *
   * When called in a migration file, this method ensures that any existing transaction
   * is committed before this migration runs, and a new transaction is started before the
   * migration in this file. This is essential for migrations that depend on previously
   * committed changes.
   *
   * Some database operations require that dependent changes be committed before they can
   * be executed. For example, check constraints that reference enum values require those
   * enum values to be committed to the database first.
   *
   * ```ts
   * // first migration file: Add enum value
   * export async function up(db: Kysely<any>): Promise<void> {
   *   await DreamMigrationHelpers.addEnumValue(db, {
   *     enumName: 'user_status',
   *     value: 'premium'
   *   })
   * }
   *
   * // second migration file: Add check constraint that depends on the enum value
   * export async function up(db: Kysely<any>): Promise<void> {
   *   DreamMigrationHelpers.newTransaction() // Ensure enum value is committed first
   *
   *   await db.schema
   *     .alterTable('users')
   *     .addCheckConstraint(
   *       'check_premium_users',
   *       sql`status = 'premium' OR credits < 100`
   *     )
   *     .execute()
   * }
   * ```
   */
  public static newTransaction() {}

  /**
   * Drop a value from an enum and replace it (or optionally remove it from array columns)
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param __namedParameters - The options for dropping the enum value
   * @param __namedParameters.enumName - The name of the enum to modify
   * @param __namedParameters.value - The name of the value to drop from the enum
   * @param __namedParameters.replacements - Details about which table and column to change and which value to replace the dropped value with (or remove it if the column is an array)
   */
  public static async dropEnumValue(
    db: Kysely<any>,
    { enumName, value, replacements }: DropValueFromEnumOpts
  ) {
    // temporarily set all table columns depending on this enum to an acceptable alternate type
    for (const tableAndColumnToChange of replacements) {
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
      .asEnum(allEnumValues.filter(val => val !== value))
      .execute()

    for (const tableAndColumnToChange of replacements) {
      const isArray = (tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray).array || false

      if (isArray) {
        await replaceArrayValues(
          db,
          value,
          tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray
        )
        await updateTableColumnToNewEnumArrayType(db, enumName, tableAndColumnToChange)
      } else {
        await replaceNonArrayValues(
          db,
          value,
          tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForNonArray
        )
        await updateTableColumnToNewEnumType(db, enumName, tableAndColumnToChange)
      }
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
async function replaceArrayValues(
  db: Kysely<any>,
  value: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumnsForArray
) {
  const { column, table } = tableAndColumnToChange

  await db
    .updateTable(table)
    .set({
      [column]:
        tableAndColumnToChange.behavior === 'remove'
          ? sql.raw(`array_remove(${column}, '${value}')`)
          : sql.raw(`array_replace(${column}, '${value}', '${tableAndColumnToChange.replaceWith}')`),
    })
    .where(sql.raw(`'${value}'`), '=', sql.raw(`ANY(${column})`))
    .execute()
}

// finds any records in the specified table
// who's targeted column is  the enum value
// we are trying to drop, and updates their
// values to a safe value provided by
// the user
async function replaceNonArrayValues(
  db: Kysely<any>,
  value: string,
  tableAndColumnToChange: DropValueFromEnumTablesAndColumnsForNonArray
) {
  const { table, column, replaceWith } = tableAndColumnToChange

  await db
    .updateTable(table)
    .set({ [column]: replaceWith })
    .where(column, '=', value)
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

interface DropValueFromEnumOpts {
  enumName: string
  value: string
  replacements: DropValueFromEnumTablesAndColumns[]
}

type DropValueFromEnumTablesAndColumns =
  | DropValueWithRemovalFromEnumTablesAndColumnsForArray
  | DropValueWithReplacementFromEnumTablesAndColumnsForArray
  | DropValueFromEnumTablesAndColumnsForNonArray

interface DropValueFromEnumTablesAndColumnsForArrayBase {
  table: string
  column: string
  array: true
}

interface DropValueWithRemovalFromEnumTablesAndColumnsForArray
  extends DropValueFromEnumTablesAndColumnsForArrayBase {
  behavior: 'replace'
  replaceWith: string
}

interface DropValueWithReplacementFromEnumTablesAndColumnsForArray
  extends DropValueFromEnumTablesAndColumnsForArrayBase {
  behavior: 'remove'
}

type DropValueFromEnumTablesAndColumnsForArray =
  | DropValueWithRemovalFromEnumTablesAndColumnsForArray
  | DropValueWithReplacementFromEnumTablesAndColumnsForArray

type DropValueFromEnumTablesAndColumnsForNonArray = {
  table: string
  column: string
  replaceWith: string | null
}

interface AddValueToEnumOpts {
  enumName: string
  value: string
}
