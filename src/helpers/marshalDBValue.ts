import { DateTime } from 'luxon'
import { DB, DBTypeCache } from '../sync/schema'
import isDecimal from './db/isDecimal'
import isPostgresArray from './db/isPostgresArray'
import marshalPGArrayValue from './marshalPGArrayValue'

export function marshalDBValue<TableName extends keyof DB>(
  value: any,
  { table, column }: { table: TableName; column: keyof DB[TableName] }
) {
  if (value !== null && value !== undefined && isDecimal(column, { table })) return parseFloat(value)
  if (value?.constructor === Date) return DateTime.fromJSDate(value)
  if (isPostgresArray(column, { table })) return marshalPGArrayValue(value, column, { table })
  return value
}
