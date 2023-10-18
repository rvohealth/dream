import { DateTime } from 'luxon'
import isDecimal from './db/types/isDecimal'
import isDatabaseArray from './db/types/isDatabaseArray'
import marshalDBArrayValue from './marshalDBArrayValue'
import Dream from '../dream'
import isDate from './db/types/isDate'

export function marshalDBValue<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName]
>(dreamClass: T, column: keyof Table, value: any) {
  if (value !== null && value !== undefined && isDecimal(dreamClass, column)) return parseFloat(value)

  if (value?.constructor === Date) {
    if (isDate(dreamClass, column)) {
      const dateString = value.toISOString().split('T')[0]
      return DateTime.fromISO(dateString, { zone: 'UTC' })
    } else {
      return DateTime.fromJSDate(value, { zone: 'UTC' })
    }
  }

  if (isDatabaseArray(dreamClass, column)) {
    return marshalDBArrayValue(dreamClass, value)
  }

  return value
}
