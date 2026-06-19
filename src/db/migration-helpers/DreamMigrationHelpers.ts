import { ColumnDataType, Kysely, RawBuilder, sql } from 'kysely'
import InternalEncrypt from '../../encrypt/InternalEncrypt.js'

export default class DreamMigrationHelpers {
  /**
   * Rename a table and its associated primary key index and sequence.
   *
   * This method renames the table, its primary key index (`{tablename}_pkey`),
   * and its primary key sequence (`{tablename}_id_seq`) to keep them in sync.
   *
   * The sequence rename is skipped for tables with UUID primary keys (which have
   * no associated sequence). The primary key index is always renamed since
   * PostgreSQL does not automatically rename it when the table is renamed.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param from - The current name of the table to rename
   * @param to - The new name for the table
   */
  public static async renameTable(db: Kysely<any>, from: string, to: string) {
    await db.schema.alterTable(from).renameTo(to).execute()

    await sql`ALTER INDEX IF EXISTS ${sql.ref(`${from}_pkey`)} RENAME TO ${sql.ref(`${to}_pkey`)}`.execute(db)

    const sequenceExists = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = ${`${from}_id_seq`}
      )
    `.execute(db)

    if (sequenceExists.rows[0]?.exists) {
      await sql`ALTER SEQUENCE ${sql.ref(`${from}_id_seq`)} RENAME TO ${sql.ref(`${to}_id_seq`)}`.execute(db)
    }
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
   * Drop a value from an enum and replace it with a different enum already
   * present in the enum type (or optionally remove it from array columns).
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

  /**
   * Convert an existing plaintext column into the encrypted-backed form expected by
   * the `@Encrypted` decorator.
   *
   * This renames `column` to `encrypted_<column>`, widens it to `text`, and rewrites
   * every non-null value with the AES-GCM ciphertext produced by the exact same code
   * path the decorator's setter uses (`InternalEncrypt.encryptColumn`). After it runs,
   * the column holds real ciphertext that the decorator's getter can decrypt — which is
   * what a bare column rename does **not** do (renaming a plaintext column to
   * `encrypted_<column>` and decorating the property leaves plaintext in the column, so
   * the getter throws `DecryptionError`).
   *
   * The encryption key and algorithm come from the application's encryption config
   * (`DreamApp` `encryption.columns.current`); if encryption is not configured this
   * throws `MissingColumnEncryptionOpts`. Null values are left null.
   *
   * ```ts
   * // plaintext `phone` column -> encrypted `encrypted_phone` text column
   * await DreamMigrationHelpers.encryptColumn(db, { table: 'users', column: 'phone' })
   * ```
   *
   * **Locks the table and rewrites rows one at a time.** Each value needs a fresh random
   * IV computed in Node, so the rewrite cannot be a single SQL `UPDATE` — it is one
   * round trip per non-null row, holding the table for the duration. On large tables do
   * not use this helper; write your own batched / online migration instead.
   *
   * **Drop any index on the column first.** Per-row updates pay index-maintenance cost on
   * every write, and an index over ciphertext is useless anyway (encrypted values are not
   * queryable). Remove the index before this migration and do not re-add it.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param options - Configuration options
   * @param options.table - The name of the table
   * @param options.column - The current (plaintext) column name
   * @param options.encryptedColumnName - The target encrypted column name. Defaults to `encrypted_<column>`, matching the `@Encrypted` decorator's default; pass this when the decorator was given a custom encrypted column name.
   * @param options.primaryKey - The primary key column used to target each row's update. Defaults to `id`.
   */
  public static async encryptColumn(
    db: Kysely<any>,
    {
      table,
      column,
      encryptedColumnName = `encrypted_${column}`,
      primaryKey = 'id',
    }: EncryptColumnOpts
  ) {
    await db.schema.alterTable(table).renameColumn(column, encryptedColumnName).execute()

    // Read the existing values BEFORE widening to text so the original JS types
    // (number, boolean, etc.) survive the JSON round trip performed by encryption.
    // Alias to fixed keys so a CamelCasePlugin on the connection cannot rename them.
    const rows = await db
      .selectFrom(table)
      .select([sql.ref(primaryKey).as('pk'), sql.ref(encryptedColumnName).as('val')])
      .where(encryptedColumnName, 'is not', null)
      .execute()

    await db.schema
      .alterTable(table)
      .alterColumn(encryptedColumnName, col => col.setDataType('text'))
      .execute()

    for (const row of rows) {
      await db
        .updateTable(table)
        .set({ [encryptedColumnName]: InternalEncrypt.encryptColumn(row.val) })
        .where(primaryKey, '=', row.pk)
        .execute()
    }
  }

  /**
   * Inverse of {@link DreamMigrationHelpers.encryptColumn}: decrypt an
   * `encrypted_<column>` column back to plaintext and rename it to `column`.
   *
   * Every non-null value is decrypted with the same path the decorator's getter uses
   * (`InternalEncrypt.decryptColumn`, which honors both the `current` and `legacy`
   * encryption keys), then the column is renamed back. Called with the same `table` and
   * `column`, this exactly reverses `encryptColumn`.
   *
   * By default the column is left as `text`, because the original column type cannot be
   * recovered from the encrypted state. Pass `columnType` to restore a specific type
   * (e.g. `'integer'`); the conversion runs `ALTER COLUMN ... TYPE <columnType> USING
   * <column>::<columnType>`.
   *
   * ```ts
   * await DreamMigrationHelpers.decryptColumn(db, { table: 'users', column: 'phone' })
   *
   * // restore the original column type as part of the inverse
   * await DreamMigrationHelpers.decryptColumn(db, { table: 'users', column: 'age', columnType: 'integer' })
   * ```
   *
   * The same per-row, table-locking caveat as `encryptColumn` applies.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param options - Configuration options
   * @param options.table - The name of the table
   * @param options.column - The target (plaintext) column name to rename back to
   * @param options.encryptedColumnName - The current encrypted column name. Defaults to `encrypted_<column>`.
   * @param options.primaryKey - The primary key column used to target each row's update. Defaults to `id`.
   * @param options.columnType - When provided, the restored column is converted to this type. When omitted, the column is left as `text`.
   */
  public static async decryptColumn(
    db: Kysely<any>,
    {
      table,
      column,
      encryptedColumnName = `encrypted_${column}`,
      primaryKey = 'id',
      columnType,
    }: DecryptColumnOpts
  ) {
    // Alias to fixed keys so a CamelCasePlugin on the connection cannot rename them.
    const rows = await db
      .selectFrom(table)
      .select([sql.ref(primaryKey).as('pk'), sql.ref(encryptedColumnName).as('val')])
      .where(encryptedColumnName, 'is not', null)
      .execute()

    for (const row of rows) {
      await db
        .updateTable(table)
        .set({ [encryptedColumnName]: InternalEncrypt.decryptColumn(row.val) })
        .where(primaryKey, '=', row.pk)
        .execute()
    }

    await db.schema.alterTable(table).renameColumn(encryptedColumnName, column).execute()

    if (columnType !== undefined) {
      await sql`
        ALTER TABLE ${sql.table(table)}
        ALTER COLUMN ${sql.ref(column)}
        TYPE ${sql.raw(columnType)}
        USING ${sql.ref(column)}::${sql.raw(columnType)};
      `.execute(db)
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
  behavior: 'remove'
}

interface DropValueWithReplacementFromEnumTablesAndColumnsForArray
  extends DropValueFromEnumTablesAndColumnsForArrayBase {
  behavior: 'replace'
  replaceWith: string
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

interface EncryptColumnOpts {
  table: string
  column: string
  encryptedColumnName?: string
  primaryKey?: string
}

interface DecryptColumnOpts {
  table: string
  column: string
  encryptedColumnName?: string
  primaryKey?: string
  columnType?: ColumnDataType
}
