import { DateTime } from 'luxon'
import isDecimalColumn from './db/types/isDecimalColumn'
import isDatabaseArrayColumn from './db/types/isDatabaseArrayColumn'
import marshalDBArrayValue from './marshalDBArrayValue'
import Dream from '../dream'
import isDateTimeColumn from './db/types/isDateTimeColumn'
import isDateColumn from './db/types/isDateColumn'

export function marshalDBValue<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName]
>(dreamClass: T, column: keyof Table, value: any) {
  if (value !== null && value !== undefined && isDecimalColumn(dreamClass, column)) return parseFloat(value)

  if (value?.constructor === Date) {
    if (isDateColumn(dreamClass, column)) {
      const dateString = value.toISOString().split('T')[0]
      return DateTime.fromISO(dateString, { zone: 'UTC' })
    } else {
      return DateTime.fromJSDate(value, { zone: 'UTC' })
    }
  }

  if (
    typeof value === 'string' &&
    (isDateTimeColumn(dreamClass, column) || isDateColumn(dreamClass, column))
  ) {
    return DateTime.fromISO(value, { zone: 'UTC' })
  }

  if (isDatabaseArrayColumn(dreamClass, column)) {
    return marshalDBArrayValue(dreamClass, value)
  }

  return value
}
