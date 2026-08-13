import { ColumnDataType, Kysely, RawBuilder, sql } from 'kysely'
import InternalEncrypt from '../../encrypt/InternalEncrypt.js'
import DropEnumValueRetypeFailed, {
  DropEnumValueRetypeFailedOpts,
  quotedRelationName,
} from '../../errors/DropEnumValueRetypeFailed.js'

export default class DreamMigrationHelpers {
  /**
   * Rename a table and its associated primary key index and sequence.
   *
   * This method renames the table, its primary key index (`{tablename}_pkey`),
   * and its primary key sequence (`{tablename}_id_seq`) to keep them in sync.
   *
   * The sequence rename applies to both legacy `serial`/`bigserial` columns and
   * modern `GENERATED ... AS IDENTITY` columns: identity columns are also backed
   * by a `{tablename}_id_seq` sequence, so they need the same rename. It is
   * skipped only for tables with UUID primary keys (which have no associated
   * sequence). The primary key index is always renamed since PostgreSQL does not
   * automatically rename it when the table is renamed.
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
    // Read the check constraints on every replacement column up front, before anything is
    // retyped. They are only ever *used* from the catch blocks below, but they cannot be read
    // from there: dropEnumValue runs inside a migration transaction (runMigration.ts routes any
    // migration mentioning it through `newTransaction`), and once a statement in a transaction
    // block errors, Postgres aborts the block and fails every subsequent statement with
    // `25P02 current transaction is aborted`. A pg_constraint SELECT issued from a catch block
    // would therefore throw itself and bury the very error we are trying to explain.
    const checkConstraintsByPosition = await checkConstraintsOnColumns(db, replacements)

    // temporarily set all table columns depending on this enum to an acceptable alternate type
    for (const [position, tableAndColumnToChange] of replacements.entries()) {
      const tableAndColumnToChangeAsArray =
        tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArrayBase
      const isArray = tableAndColumnToChangeAsArray.array || false

      await retypeOrExplain(
        () =>
          db.schema
            .alterTable(tableAndColumnToChange.table)
            .alterColumn(tableAndColumnToChange.column, col =>
              col.setDataType(computedTemporaryType(isArray))
            )
            .execute(),
        {
          enumName,
          value,
          table: tableAndColumnToChange.table,
          column: tableAndColumnToChange.column,
          retypeDirection: 'toText',
          ...constraintContextFor(checkConstraintsByPosition, position),
        }
      )
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

    for (const [position, tableAndColumnToChange] of replacements.entries()) {
      const isArray = (tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray).array || false

      const retypeContext: Omit<DropEnumValueRetypeFailedOpts, 'originalError'> = {
        enumName,
        value,
        table: tableAndColumnToChange.table,
        column: tableAndColumnToChange.column,
        retypeDirection: 'toEnum',
        ...constraintContextFor(checkConstraintsByPosition, position),
      }

      if (isArray) {
        await replaceArrayValues(
          db,
          value,
          tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForArray
        )
        await retypeOrExplain(
          () => updateTableColumnToNewEnumArrayType(db, enumName, tableAndColumnToChange),
          retypeContext
        )
      } else {
        await replaceNonArrayValues(
          db,
          value,
          tableAndColumnToChange as DropValueFromEnumTablesAndColumnsForNonArray
        )
        await retypeOrExplain(
          () => updateTableColumnToNewEnumType(db, enumName, tableAndColumnToChange),
          retypeContext
        )
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
   * Intended for text/string columns (the common case is text -> encrypted text). The
   * column is widened to `text` before reading, so values are encrypted as their text
   * form; the inverse `decryptColumn` can restore a non-text type via its `columnType`
   * option.
   *
   * ```ts
   * // plaintext `phone` column -> encrypted `encrypted_phone` text column
   * await DreamMigrationHelpers.encryptColumn(db, { table: 'users', column: 'phone' })
   * ```
   *
   * **Rewrites rows one at a time** (each value needs a fresh random IV computed in Node,
   * so the rewrite cannot be a single SQL `UPDATE`), reading them in keyset batches of
   * `batchSize` to bound memory. It still holds the table for the migration's duration; on
   * very large tables do not use this helper — write your own batched / online migration.
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
   * @param options.primaryKey - The primary key column used to keyset-paginate and target each row's update. Defaults to `id`.
   * @param options.batchSize - How many rows to read per batch. Defaults to `1000`.
   */
  public static async encryptColumn(
    db: Kysely<any>,
    {
      table,
      column,
      encryptedColumnName = `encrypted_${column}`,
      primaryKey = 'id',
      batchSize = 1000,
    }: EncryptColumnOpts
  ) {
    await db.schema.alterTable(table).renameColumn(column, encryptedColumnName).execute()

    await db.schema
      .alterTable(table)
      .alterColumn(encryptedColumnName, col => col.setDataType('text'))
      .execute()

    await this.transformColumnInBatches(
      db,
      { table, column: encryptedColumnName, primaryKey, batchSize },
      value => InternalEncrypt.encryptColumn(value)
    )
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
   * The same per-row, batched, table-locking caveat as `encryptColumn` applies.
   *
   * @param db - The Kysely database object passed into the migration up/down function
   * @param options - Configuration options
   * @param options.table - The name of the table
   * @param options.column - The target (plaintext) column name to rename back to
   * @param options.encryptedColumnName - The current encrypted column name. Defaults to `encrypted_<column>`.
   * @param options.primaryKey - The primary key column used to keyset-paginate and target each row's update. Defaults to `id`.
   * @param options.batchSize - How many rows to read per batch. Defaults to `1000`.
   * @param options.columnType - When provided, the restored column is converted to this type. When omitted, the column is left as `text`.
   */
  public static async decryptColumn(
    db: Kysely<any>,
    {
      table,
      column,
      encryptedColumnName = `encrypted_${column}`,
      primaryKey = 'id',
      batchSize = 1000,
      columnType,
    }: DecryptColumnOpts
  ) {
    await this.transformColumnInBatches(
      db,
      { table, column: encryptedColumnName, primaryKey, batchSize },
      value => InternalEncrypt.decryptColumn(value)
    )

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

  /**
   * Walk every non-null value of `column` in keyset batches of `batchSize`, applying
   * `transform` in Node and writing the result back one row at a time. Keyset pagination
   * on `primaryKey` (`WHERE pk > last ORDER BY pk`) bounds memory to a single batch and
   * guarantees forward progress, so a row is never read — or transformed — twice (which
   * matters because the transform is not idempotent: re-encrypting ciphertext would
   * double-encrypt, and re-decrypting plaintext would throw).
   *
   * Reads alias the selected columns to fixed keys via `sql.ref(...).as(...)` so a
   * `CamelCasePlugin` on the connection cannot rename the result keys.
   */
  private static async transformColumnInBatches(
    db: Kysely<any>,
    {
      table,
      column,
      primaryKey,
      batchSize,
    }: { table: string; column: string; primaryKey: string; batchSize: number },
    transform: (value: any) => any
  ) {
    let lastPrimaryKey: any

    for (;;) {
      let query = db
        .selectFrom(table)
        .select([sql.ref(primaryKey).as('pk'), sql.ref(column).as('val')])
        .where(column, 'is not', null)
        .orderBy(primaryKey)
        .limit(batchSize)
      if (lastPrimaryKey !== undefined) query = query.where(primaryKey, '>', lastPrimaryKey)

      const rows = await query.execute()
      if (rows.length === 0) break

      for (const row of rows) {
        await db
          .updateTable(table)
          .set({ [column]: transform(row.val) })
          .where(primaryKey, '=', row.pk)
          .execute()
        lastPrimaryKey = row.pk
      }
    }
  }
}

/**
 * Run one of dropEnumValue's internal column retypes, and on failure re-raise it as a
 * {@link DropEnumValueRetypeFailed} naming the table, the column and the check constraints
 * that were read before any retype ran. The original error is kept reachable underneath.
 *
 * A caught throwable is normalized to an `Error` rather than cast to one: the error's
 * message getter dereferences `originalError.message`, so a driver (or a mock) that rejects
 * with a non-Error would otherwise blow up inside the getter and destroy the very
 * diagnostic this wrapping exists to produce.
 */
async function retypeOrExplain(
  retype: () => Promise<unknown>,
  context: Omit<DropEnumValueRetypeFailedOpts, 'originalError'>
) {
  try {
    await retype()
  } catch (error) {
    throw new DropEnumValueRetypeFailed({
      ...context,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }
}

/**
 * The check constraints defined on each replacement's column, indexed by the replacement's
 * position in `replacements` (both of dropEnumValue's loops walk the same array in order, so
 * the position identifies a replacement exactly and no key string has to be kept in sync).
 *
 * Position, rather than the replacement object, because the same object may legitimately
 * appear at two positions — `const r = {...}; replacements: [r, r]` — and a Map keyed on the
 * object would collapse those two entries onto one, reporting each column's constraints twice
 * and emitting a duplicated dropConstraint line for every one of them.
 *
 * One catalog query covers every replacement: the (relation, column) pairs are passed as two
 * arrays and unnested `WITH ORDINALITY`, so each row carries the 1-based position of the
 * replacement it belongs to. Issuing one query per replacement would cost a round trip per
 * column on every successful `dropEnumValue`, and Kysely serializes them all on the
 * migration's single connection.
 *
 * `relationResolved` is selected separately from the constraints, because "the table has no
 * check constraints" and "the table name did not resolve" both produce zero constraint rows
 * and the error message must not confuse the two.
 *
 * `to_regclass` rather than a `::regclass` cast so that an unknown table yields no rows
 * instead of throwing, leaving the retype itself to report a missing table exactly as it
 * does today. The name handed to it is quoted per segment, because Kysely quotes the
 * identifiers it emits (`alterTable('MixedCase')` -> `"MixedCase"`) while an unquoted
 * `to_regclass` argument case-folds and would silently miss every non-lowercase table.
 *
 * The selected aliases are deliberately single words: a `CamelCasePlugin` on the connection
 * rewrites result keys, and `ord`/`resolved`/`name`/`definition` survive that rewrite
 * unchanged.
 */
async function checkConstraintsOnColumns(
  db: Kysely<any>,
  replacements: DropValueFromEnumTablesAndColumns[]
): Promise<ColumnCheckConstraints[]> {
  const byPosition: ColumnCheckConstraints[] = replacements.map(() => ({
    relationResolved: false,
    checkConstraints: [],
  }))
  if (replacements.length === 0) return byPosition

  const relationNames = replacements.map(replacement => quotedRelationName(replacement.table))
  const columnNames = replacements.map(replacement => replacement.column)

  const response = await sql<CheckConstraintRow>`
    SELECT
      t.ord::int AS ord,
      (to_regclass(t.relname) IS NOT NULL) AS resolved,
      con.name AS name,
      con.definition AS definition
    FROM unnest(${relationNames}::text[], ${columnNames}::text[])
      WITH ORDINALITY AS t(relname, colname, ord)
    LEFT JOIN LATERAL (
      SELECT c.conname AS name, pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'c'
        AND c.conrelid = to_regclass(t.relname)
        AND a.attname = t.colname
    ) con ON true
    ORDER BY t.ord, con.name
  `.execute(db)

  for (const row of response.rows) {
    const entry = byPosition[Number(row.ord) - 1]
    if (entry === undefined) continue

    entry.relationResolved = row.resolved
    if (row.name !== null && row.definition !== null) {
      entry.checkConstraints.push({ name: row.name, definition: row.definition })
    }
  }

  return byPosition
}

/**
 * The constraint metadata for the replacement at `position`. A position with no entry (which
 * cannot happen today, but would be a silent lie if it did) reads as "not read", never as
 * "none defined".
 */
function constraintContextFor(
  byPosition: ColumnCheckConstraints[],
  position: number
): ColumnCheckConstraints {
  return byPosition[position] ?? { relationResolved: false, checkConstraints: [] }
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

type ColumnCheckConstraints = Pick<DropEnumValueRetypeFailedOpts, 'relationResolved' | 'checkConstraints'>

interface CheckConstraintRow {
  ord: number | string
  resolved: boolean
  name: string | null
  definition: string | null
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
  batchSize?: number
}

interface DecryptColumnOpts {
  table: string
  column: string
  encryptedColumnName?: string
  primaryKey?: string
  batchSize?: number
  columnType?: ColumnDataType
}
