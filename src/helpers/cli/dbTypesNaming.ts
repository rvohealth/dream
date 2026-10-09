import { IntrospectedTable } from '../../types/db.js'
import pascalize from '../pascalize.js'

/**
 * @internal
 *
 * The value types an array column lists in a plain array in types/db.ts. Any
 * other is listed through `ArrayType`, which turns a `ColumnType` (such as
 * `Int8`) into a `ColumnType` of arrays.
 */
export const PLAIN_ARRAY_VALUE_TYPES: string[] = ['string', 'number', 'boolean', 'ClockTime', 'ClockTimeTz']

/**
 * @internal
 *
 * The declaration of each type that types/db.ts declares for its columns.
 */
export const HELPER_TYPE_DECLARATIONS: Record<string, string> = {
  ArrayType: 'export type ArrayType<T> = ArrayTypeImpl<T> extends (infer U)[] ? U[] : ArrayTypeImpl<T>',
  ArrayTypeImpl:
    'export type ArrayTypeImpl<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S[], I[], U[]> : T[]',
  Circle: 'export type Circle = { x: number; y: number; radius: number }',
  Generated:
    'export type Generated<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>',
  Int8: 'export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>',
  Interval:
    'export type Interval = ColumnType<IPostgresInterval, IPostgresInterval | number | string, IPostgresInterval | number | string>',
  Json: 'export type Json = JsonValue',
  JsonArray: 'export type JsonArray = JsonValue[]',
  JsonObject: 'export type JsonObject = {\n  [x: string]: JsonValue | undefined\n}',
  JsonPrimitive: 'export type JsonPrimitive = boolean | number | string | null',
  JsonValue: 'export type JsonValue = JsonArray | JsonObject | JsonPrimitive',
  Numeric: 'export type Numeric = ColumnType<string, number | string, number | string>',
  Point: 'export type Point = { x: number; y: number }',
  Timestamp: 'export type Timestamp = ColumnType<DateTime | CalendarDate>',
}

/**
 * @internal
 *
 * The types types/db.ts declares for the given tables' columns.
 */
export function dbTypesHelperNames(tables: IntrospectedTable[]): string[] {
  const names = new Set<string>()

  for (const column of tables.flatMap(table => table.columns)) {
    if (column.hasDefault) names.add('Generated')
    if (column.isArray && !PLAIN_ARRAY_VALUE_TYPES.includes(column.valueType)) {
      names.add('ArrayType').add('ArrayTypeImpl')
    }
    if (column.valueType === 'Json') {
      names.add('Json').add('JsonArray').add('JsonObject').add('JsonPrimitive').add('JsonValue')
    }
    if (HELPER_TYPE_DECLARATIONS[column.valueType]) names.add(column.valueType)
  }

  return [...names].sort()
}

/**
 * @internal
 *
 * The names that types/db.ts declares, imports or uses from JavaScript for
 * the given tables, which no enum or table interface may take.
 */
export function dbTypesReservedNames(tables: IntrospectedTable[]): string[] {
  const valueTypes = new Set(tables.flatMap(table => table.columns.map(column => column.valueType)))

  return [
    'CalendarDate',
    'ClockTime',
    'ClockTimeTz',
    'ColumnType',
    'DB',
    'DBClass',
    'DateTime',
    ...dbTypesHelperNames(tables),
    ...(valueTypes.has('Date') ? ['Date'] : []),
    ...(valueTypes.has('Buffer') ? ['Buffer'] : []),
    ...(valueTypes.has('Interval') ? ['IPostgresInterval'] : []),
  ]
}

/**
 * @internal
 *
 * The TypeScript name types/db.ts gives a table or enum: its name, with a
 * schema's `.` as `_`, pascalized, and prefixed with `_` when it would start
 * with a digit. A number is added when the name is in `takenNames`, which
 * the chosen name joins.
 */
export function dbTypesName(name: string, takenNames: Set<string>) {
  const pascalized: string = pascalize(name.replace(/\./g, '_'))
  const baseName = /^\d/.test(pascalized) ? `_${pascalized}` : pascalized

  let typeName = baseName
  for (let suffix = 2; takenNames.has(typeName); suffix++) typeName = `${baseName}${suffix}`
  takenNames.add(typeName)

  return typeName
}
