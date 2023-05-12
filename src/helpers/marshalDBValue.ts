import { DateTime } from 'luxon'
import { DB, DBTypeCache } from '../sync/schema'
import isDecimal from './db/isDecimal'

export function marshalDBValue<TableName extends keyof DB>(
  value: any,
  { table, column }: { table: TableName; column: keyof DB[TableName] }
) {
  if (isDecimal(column, { table })) return parseFloat(value)
  if (value?.constructor === Date) return DateTime.fromJSDate(value)
  return value
}
