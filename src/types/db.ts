import { postgresDatatypes } from '../db/dataTypes.js'
import { primaryKeyTypes } from '../dream/constants.js'

export type DbConnectionType = 'primary' | 'replica'

export type AssociationTableNames<DB, Schema> = keyof DB & keyof Schema extends never
  ? unknown
  : keyof DB & keyof Schema & string
export type Tables<DB> = keyof DB
export type TableInterfaces<DB> = valueof<DB>

type valueof<T> = T[keyof T]

export type NonArrayDbTypes = (typeof postgresDatatypes)[number]
export type DbTypes = NonArrayDbTypes | `${NonArrayDbTypes}[]`
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]
export type LegacyCompatiblePrimaryKeyType = PrimaryKeyType | 'uuid' | 'bigserial'

/**
 * A connection's tables and enums, as a query driver's `introspectDatabase`
 * reads them. `sync` writes both of a connection's types files from it:
 * `types/db.ts`, which types the connection's Kysely queries, and
 * `types/dream.ts`, Dream's schema.
 */
export interface IntrospectedDatabase {
  tables: IntrospectedTable[]
  enums: IntrospectedEnum[]
}

export interface IntrospectedTable {
  /**
   * The table's schema, e.g. `public`, or `null` for a database without
   * schemas. A table pattern that contains a `.` is matched against
   * `<schema>.<name>` (see `tableIncludePattern`).
   */
  schema: string | null
  /**
   * The table's name, e.g. `balloon_lines`.
   */
  name: string
  /**
   * Whether the table is in the connection's default schema. Kysely queries
   * name such a table alone, and any other as `<schema>.<name>`.
   */
  inDefaultSchema: boolean
  columns: IntrospectedColumn[]
}

export interface IntrospectedColumn {
  /**
   * The column's name, e.g. `created_at`.
   */
  name: string
  /**
   * The column's database type as Dream's schema records it, e.g. `bigint`,
   * `timestamp without time zone[]`, or an enum's name.
   */
  dbType: string
  /**
   * The type of one of the column's values in `types/db.ts`, or `'enum'`
   * when the values are those of `enumName`.
   */
  valueType: IntrospectedValueType
  /**
   * The name of the enum the column's values belong to, or `null`. An enum
   * outside the connection's default schema is named `<schema>.<name>`.
   */
  enumName: string | null
  isArray: boolean
  allowNull: boolean
  /**
   * Whether an insert may leave the column out: it has a default, or the
   * database generates its values.
   */
  hasDefault: boolean
}

export interface IntrospectedEnum {
  /**
   * The enum's name, as columns' `enumName` gives it, e.g.
   * `balloon_colors_enum`.
   */
  name: string
  values: string[]
}

/**
 * The types `types/db.ts` can give one value of a column. `Int8`, `Numeric`,
 * `Timestamp` (a `DateTime` or `CalendarDate`), `Json`, `Interval`, `Point`
 * and `Circle` are declared in that file; `Date` and `Buffer` are
 * JavaScript's.
 */
export type IntrospectedValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'Int8'
  | 'Numeric'
  | 'Timestamp'
  | 'Date'
  | 'ClockTime'
  | 'ClockTimeTz'
  | 'Json'
  | 'Buffer'
  | 'Interval'
  | 'Point'
  | 'Circle'
  | 'enum'
